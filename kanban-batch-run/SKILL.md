---
name: kanban-batch-run
description: Run multiple kanban tasks end-to-end in planned order using the existing kanban and kanban-run workflows. Use when the user wants a batch such as `500-504`, `500,501,504`, or a short ordered task list executed automatically, with conservative sequencing by default and parallel execution only when tasks are clearly independent.
---

# Kanban Batch Run

Execute several kanban tasks as one orchestrated batch. Expand task ranges, sort them by phase, run them one after another, and only open parallel lanes when independence is explicit and low-risk.

This skill is an orchestrator, not a shortcut. For every task it runs, it must hand off to the `kanban-run` skill via the Skill tool and keep that task's pipeline honest.

## Commands

### `/kanban-batch-run <selector> [--auto]`

Run all tasks matching the selector in dependency order.

- **Default mode**: L1 tasks run with `--auto`. L2/L3 tasks run without `--auto` so that plan_review and impl_review pause for user confirmation.
- **`--auto`**: All tasks run with `--auto` regardless of level. Circuit breakers still fire inside `kanban-run`.

### `/kanban-batch-run resume <start-ID> [--auto]`

Resume a previously stopped batch from the given task ID onward. Uses the same selector logic but skips all tasks before `<start-ID>`. Useful after fixing a blocker reported by a prior batch run.

## Inputs

- Accept task selectors like `500-504`, `500~504`, `500,501,504`, or whitespace-separated IDs.
- Reverse ranges like `504-500` are normalized to ascending order (500, 501, 502, 503, 504).
- Read `../kanban/shared.md` before any API call.
- Invoke `kanban-run` for each individual task using the Skill tool — do not emulate or re-implement its pipeline.

## Resources

- Use `scripts/plan_batch.py` to normalize selectors, fetch task metadata, and produce phase-ordered candidates.
- Read `references/parallel-rules.md` when deciding whether tasks are safe to run in parallel.

## Metadata Hints

If task descriptions include any of these lines, use them as strong signals:

- `Depends on: #500, #501`
- `Parallel-safe: yes`
- `Parallel-safe: no`
- `Touches: browse-data, header-nav`

If these hints are absent, fall back to conservative inference from phase, tags, title, and description.

## Workflow

### 0. Pre-flight checks

Before any execution:

```bash
# Server health check
curl -sf "http://localhost:5173/api/board?project=$PROJECT&summary=true" > /dev/null
```

- If the server is not reachable, instruct the user to run `./kanban-board/start.sh` and stop.
- If `plan_batch.py` fails (connection refused, HTTP error), do not proceed — report the error and stop.

### 1. Resolve project

Resolve the current project from `.codex/kanban.json` or `.claude/kanban.json`.

### 2. Plan

Run:

```bash
python3 scripts/plan_batch.py --project "$PROJECT" --tasks "<selector>"
```

### 3. Read plan

Read the returned task list and proposed groups.

### 4. Validate ordering

- Respect `phase:N` tags when present.
- If tasks were user-ordered but phase tags disagree, prefer phase order and say so.
- **Non-todo tasks**: Skip tasks not in `todo` with a warning line per skipped task (e.g. `⚠ #502 skipped — status is impl`). Continue the batch with remaining tasks. If all tasks are skipped, stop and report.
- If `resume <start-ID>` was used, skip all tasks before that ID silently.

### 5. Decide execution mode

- Default: sequential.
- Allow parallel only if all of these are true:
  - same phase or no phase tag
  - no task description says it depends on another task in the batch
  - titles/tags/descriptions point to distinct modules or surfaces
  - failure in one task would not invalidate another task's work
- If any doubt remains, stay sequential.
- Prefer explicit `Depends on:` / `Parallel-safe:` metadata over heuristic guesses.

### 6. Execute each group

**Sequential group**: invoke the Skill tool for each task in order (see Inner Task Contract for level-aware invocation).

**Parallel group**:
- Invoke the Skill tool for all tasks in the group concurrently (single message, multiple Skill tool calls).
- After the parallel group completes, run a git integrity check:
  ```bash
  git status --porcelain
  git diff --check  # detect conflict markers
  ```
- If conflict markers or merge issues are found, stop the batch and report which tasks conflicted.

**After each task or group**: refresh board state by reading the task's current status from the API before continuing.

### 7. Stop conditions

Stop the batch if any of these happen:

- Requirement ambiguity that needs the user.
- Repeated review/test failure (circuit breaker fired inside `kanban-run`).
- Conflicting code changes between parallel tasks (detected by git check in step 6).
- A task exits the normal path and needs a product decision.
- **Parallel group partial failure**: If one task in a parallel group fails, wait for all remaining tasks in that group to complete (do not kill in-progress tasks), then stop the batch. Report which tasks succeeded and which failed.

### 8. Early stop summary

When stopped early, summarize:

- Completed task IDs.
- Current blocker and which task caused it.
- Exact next task to resume from: `Resume with: /kanban-batch-run resume <next-ID>`.

### 9. Completion summary

When finished, summarize:

- Completed IDs in order.
- Whether any groups were parallelized.
- Resulting commits / verification if applicable.

## Execution Notes

- Be conservative. This skill is for throughput, not bravado.
- Do not implement a task "freehand" and patch kanban state afterward as if `kanban-run` had happened. The batch runner must drive each task through the Skill tool.
- Treat `kanban-run` as the inner engine and `kanban-batch-run` as the outer scheduler.
- For exploration-generated chains like `500-504`, assume sequential unless the phase model proves otherwise.
- Do not invent hidden dependencies, but do not ignore obvious ones either.
- If a prior task creates data contracts, routes, or shared components used by later tasks, keep the chain sequential.
- Re-check the worktree between tasks. If one task changed files the next task also needs, that is expected in a sequential chain.
- Treat shared routes, shared server loaders, shared types, and shared top-level navigation as dependency hotspots.
- Only parallelize when the batch planner can explain the decision in one sentence.

## Inner Task Contract

For every task selected in the batch, invoke the `kanban-run` skill via the Skill tool.

### Level-aware invocation

| Level | Default mode | `--auto` flag |
|-------|-------------|---------------|
| L1 | `Skill(skill="kanban-run", args="<ID> --auto")` | same |
| L2 | `Skill(skill="kanban-run", args="<ID>")` | `Skill(skill="kanban-run", args="<ID> --auto")` |
| L3 | `Skill(skill="kanban-run", args="<ID>")` | `Skill(skill="kanban-run", args="<ID> --auto")` |

In default mode, L2/L3 tasks pause for user confirmation at review checkpoints. The batch runner waits for the Skill call to complete (including any user interaction) before moving to the next task.

### Result verification

After each Skill call completes, verify the outcome by checking the task's kanban status:

```bash
STATUS=$(curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT&fields=status" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
```

| Status | Interpretation | Action |
|--------|---------------|--------|
| `done` | Task completed successfully | Continue to next task |
| `todo`, `plan`, `impl` | Circuit breaker or rejection occurred | Stop batch, report blocker |
| `plan_review`, `impl_review` | Review pending (should not happen in `--auto`) | Stop batch, report |

### Rules

- Do not emulate or re-implement the `kanban-run` pipeline. Always invoke it via the Skill tool.
- If a task blocks (circuit breaker, review failure, ambiguity), the status check will surface it — stop the batch and report the exact resume task.
- For parallel groups, issue multiple Skill tool calls in a single message so they run concurrently.

## Output Style

- Start with the resolved plan:
  - ordered tasks
  - proposed grouping
  - whether execution will be sequential or mixed
  - one-line reason per group
  - skipped tasks (if any)
- Then execute.
- End with a short batch summary plus the next resume point if the batch stopped early.
