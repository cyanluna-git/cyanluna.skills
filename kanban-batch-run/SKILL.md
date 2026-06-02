---
name: kanban-batch-run
description: Run multiple kanban tasks end-to-end in Rolling Wave order — refine each task based on the prior card's actual implementation, then implement, then verify, then refine the next. Use for epic-level batch execution. --big-bang flag disables rolling wave for simple independent tasks.
---

# Kanban Batch Run

Execute several kanban tasks as one orchestrated batch using **Rolling Wave Planning** by default.

Default loop per task:
```
refine(N) → implement(N) → verify(N) → refine(N+1) → implement(N+1) → ...
```

This skill is an orchestrator, not a shortcut. Every implement step hands off to `kanban-run`. Every refine step hands off to `kanban-refine`.

## Codex Invocation Rule

When running inside Codex, if a dedicated Skill tool is not available, invoke the inner runners by issuing slash command text directly:

- `$kanban-run <ID>` / `$kanban-run <ID> --auto`
- `$kanban-refine <ID>`

Treat these as the Codex-native equivalent of `Skill(skill="kanban-run", ...)` and `Skill(skill="kanban-refine", ...)`.
Do not re-implement either pipeline manually when this command path is available.

## Commands

### `/kanban-batch-run <selector> [--auto] [--big-bang]`

Run all tasks matching the selector in dependency order.

- **Default (Rolling Wave)**: refine(N) → implement(N) → verify(N) → repeat. L2/L3 tasks pause at review checkpoints for user confirmation.
- **`--auto`**: auto-approve all review checkpoints inside `kanban-run`. Refine and Verify always run.
- **`--big-bang`**: skip rolling wave — implement tasks directly without pre-refine or verify steps. Use only when tasks are fully refined upfront and independent.

### `/kanban-batch-run resume <start-ID> [--auto]`

Resume a previously stopped batch from the given task ID onward. Uses the same selector logic but skips all tasks before `<start-ID>`. Useful after fixing a blocker reported by a prior batch run.

## Inputs

- Accept task selectors: `500-504`, `500~504`, `500,501,504`, or whitespace-separated IDs.
- Reverse ranges like `504-500` are normalized to ascending order.
- Read `../kanban/shared.md` before any DB access.
- Read `../kanban/principles.md` — **mandatory, not optional.**
- Invoke `kanban-run` and `kanban-refine` for each task via the Skill tool when available.
- In Codex environments without the Skill tool, invoke via `$kanban-run ...` / `$kanban-refine ...` directly.
- Do not emulate or re-implement either pipeline.

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
# DB reachability check
test -f "$DB" || { echo "Error: DB not found at $DB. Run /kanban-init first."; exit 1; }
sqlite3 "$DB" "SELECT count(*) FROM tasks WHERE project='$PROJECT'" > /dev/null
```

- If DB not found: instruct the user to run `/kanban-init` and stop.
- If `plan_batch.py` fails, do not proceed — report the error and stop.

### 1. Resolve project

Resolve the current project from `.codex/kanban.json` or `.claude/kanban.json`.

### 2. Plan

Run:

```bash
python3 scripts/plan_batch.py --project "$PROJECT" --tasks "<selector>" --db "$DB"
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

### 6. Execute — Rolling Wave Loop (default)

For each task N in order:

```
A. Refine(N)
   - Skill(skill="kanban-refine", args="<ID>")  [Codex: $kanban-refine <ID>]
   - kanban-refine auto-detects the prior card (N-1) via "Depends on:" tags or asks one question.
   - First task in the batch (no prior card): regular user interview.

B. Implement(N)
   - Invoke kanban-run (level-aware, see Inner Task Contract)

C. Verify(N)
   - Check actual implementation: git diff, created/modified files, test results
   - Append note to task: sqlite3 "$DB" json_insert on notes field → "Verified: [confirmed interface/schema]"
   - Note anything that will affect N+1's refinement scope

→ Move to N+1
```

**Loop exceptions:**
- Circuit breaker or blocker during Implement → stop, report resume point
- Unexpected design change during Verify → update downstream task descriptions; report to user

### 6b. Execute — Big Bang mode (`--big-bang`)

Invoke `kanban-run` directly per task. No refine or verify steps.
Use only when all tasks were fully refined before the batch started.

**Sequential group**: invoke `kanban-run` for each task in order (see Inner Task Contract for level-aware invocation).

**Parallel group**:
- Invoke `kanban-run` for all tasks in the group concurrently.
- In environments with a Skill tool, this means multiple Skill tool calls in one message.
- In Codex environments, this means multiple `$kanban-run ...` invocations only if the runtime truly supports concurrent slash command execution; otherwise stay sequential.
- After the parallel group completes, run a git integrity check:
  ```bash
  git status --porcelain
  git diff --check  # detect conflict markers
  ```
- If conflict markers or merge issues are found, stop the batch and report which tasks conflicted.

**After each task or group**: refresh board state by reading the task's current status from SQLite before continuing.

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
- Do not implement a task "freehand" and patch kanban state afterward as if `kanban-run` had happened. The batch runner must drive each task through `kanban-run`.
- Treat `kanban-run` as the inner engine and `kanban-batch-run` as the outer scheduler.
- For exploration-generated chains like `500-504`, assume sequential unless the phase model proves otherwise.
- Do not invent hidden dependencies, but do not ignore obvious ones either.
- If a prior task creates data contracts, routes, or shared components used by later tasks, keep the chain sequential.
- Re-check the worktree between tasks. If one task changed files the next task also needs, that is expected in a sequential chain.
- Treat shared routes, shared server loaders, shared types, and shared top-level navigation as dependency hotspots.
- Only parallelize when the batch planner can explain the decision in one sentence.

## Inner Task Contract

For every task selected in the batch, invoke `kanban-run`.

- Preferred path: `Skill(skill="kanban-run", args="...")`
- Codex fallback path: issue `$kanban-run ...` directly

The batch runner must inherit `kanban-run`'s provider-aware model router, so Codex batch execution automatically uses the higher-tier Codex mappings from `../kanban/models.json`.

### Level-aware invocation

| Level | Default mode | `--auto` flag |
|-------|-------------|---------------|
| L1 | `Skill(skill="kanban-run", args="<ID> --auto")` | same |
| L2 | `Skill(skill="kanban-run", args="<ID>")` | `Skill(skill="kanban-run", args="<ID> --auto")` |
| L3 | `Skill(skill="kanban-run", args="<ID>")` | `Skill(skill="kanban-run", args="<ID> --auto")` |

Codex direct-command equivalent:

| Level | Default mode | `--auto` flag |
|-------|-------------|---------------|
| L1 | `$kanban-run <ID> --auto` | same |
| L2 | `$kanban-run <ID>` | `$kanban-run <ID> --auto` |
| L3 | `$kanban-run <ID>` | `$kanban-run <ID> --auto` |

In default mode, L2/L3 tasks pause for user confirmation at review checkpoints. The batch runner waits for the Skill call to complete (including any user interaction) before moving to the next task.

### Result verification

After each Skill call completes, verify the outcome by checking the task's kanban status:

```bash
STATUS=$(sqlite3 "$DB" "SELECT status FROM tasks WHERE id=$ID AND project='$PROJECT'")
```

| Status | Interpretation | Action |
|--------|---------------|--------|
| `done` | Task completed successfully | Continue to next task |
| `todo`, `plan`, `impl` | Circuit breaker or rejection occurred | Stop batch, report blocker |
| `plan_review`, `impl_review` | Review pending (should not happen in `--auto`) | Stop batch, report |

### Rules

- Do not emulate or re-implement the `kanban-run` pipeline.
- Always invoke it via the Skill tool when available, or via `$kanban-run ...` in Codex when the Skill tool is unavailable.
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
