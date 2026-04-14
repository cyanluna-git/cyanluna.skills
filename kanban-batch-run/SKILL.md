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

This skill is an orchestrator, not a shortcut. Every implement step hands off to `kanban-run` via the Skill tool. Every refine step hands off to `kanban-refine` via the Skill tool.

---

## Commands

### `/kanban-batch-run <selector> [--auto] [--big-bang]`

Run all tasks matching the selector in dependency order.

- **Default (Rolling Wave)**: refine(N) → implement(N) → verify(N) → repeat. L2/L3 tasks pause at review checkpoints for user confirmation.
- **`--auto`**: auto-approve all review checkpoints inside `kanban-run`. Refine and Verify always run.
- **`--big-bang`**: skip rolling wave — implement tasks directly without pre-refine or verify steps. Use only when tasks are fully refined upfront and independent.

### `/kanban-batch-run resume <start-ID> [--auto]`

Resume a stopped batch from the given task ID. Skips all tasks before `<start-ID>`. Resumes with the same mode (rolling wave unless `--big-bang` was set).

---

## Inputs

- Accept task selectors: `500-504`, `500~504`, `500,501,504`, or whitespace-separated IDs.
- Reverse ranges like `504-500` are normalized to ascending order.
- Read `../kanban/shared.md` before any API call.
- Invoke `kanban-run` and `kanban-refine` for each task via the Skill tool — never re-implement their logic.

## Resources

- Use `scripts/plan_batch.py` to normalize selectors, fetch task metadata, and produce phase-ordered candidates.
- Read `references/parallel-rules.md` when deciding whether tasks are safe to run in parallel.

## Metadata Hints

Strong signals in task descriptions:

- `Depends on: #500, #501`
- `Parallel-safe: yes` / `Parallel-safe: no`
- `Touches: browse-data, header-nav`

Fall back to conservative inference from phase, tags, title, and description when hints are absent.

---

## Workflow

### 0. Pre-flight checks

```bash
curl -sf "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true" > /dev/null
```

- If server unreachable: instruct user to run `./kanban-board/start.sh` and stop.
- If `plan_batch.py` fails: report error and stop.

### 1. Resolve project

Read `.codex/kanban.json` or `.claude/kanban.json`.

### 2. Plan

```bash
python3 scripts/plan_batch.py --project "$PROJECT" --tasks "<selector>" --base-url "$BASE_URL" --auth-token "$AUTH_TOKEN"
```

### 3. Read plan

Read the returned task list and proposed groups.

### 4. Validate ordering

- Respect `phase:N` tags when present; prefer phase order over user order if they conflict.
- **Non-todo tasks**: skip with a warning line (e.g. `⚠ #502 skipped — status is impl`). If all tasks skipped, stop and report.
- `resume <start-ID>`: skip tasks before that ID silently.

### 5. Decide execution mode per group

- Default: sequential.
- Parallel only if **all** of these are true:
  - Same phase or no phase tag
  - No `Depends on:` relationship between tasks in the group
  - Titles/tags/descriptions point to distinct modules or surfaces
  - Failure in one would not invalidate another's work
- If any doubt remains, stay sequential.
- **Rolling wave + parallel**: run refine steps for a parallel group concurrently (multiple `kanban-refine` calls), then implement concurrently. Verify sequentially.

### 6. Execute — Rolling Wave Loop (default)

For each task N in order:

```
A. Refine(N)
   - Invoke: Skill(skill="kanban-refine", args="<ID>")
   - kanban-refine will auto-detect the prior card (N-1) via "Depends on:" tags or ask one question.
   - It reads N-1's implementation_notes + actual codebase to ground N's description.
   - For the first task in the batch (no prior card): kanban-refine does a regular user interview.

   Card split check (run before invoking kanban-refine):
   - Read current task description briefly.
   - If scope obviously exceeds limits (AC > 5, files > 5, multi-layer), split the card first:
     1. Create sub-cards via kanban API
     2. Replace N in the execution order with N-a, N-b, N-c
     3. Report split to user, continue automatically

B. Implement(N)
   - Invoke kanban-run via Skill tool (level-aware, see Inner Task Contract)

C. Verify(N)
   - Check actual implementation: git diff, created/modified files, test results
   - Add kanban note summarizing what was confirmed:
     curl POST /api/task/$ID/note → "Verified: [interface/schema/component confirmed]"
   - Note anything that will affect N+1's refinement scope

→ Move to N+1
```

**Loop exceptions:**
- Refine produces a scope that triggers a split → insert sub-cards, continue
- Implement hits a circuit breaker or blocker → stop batch, report with resume point
- Verify reveals unexpected design change → update downstream task descriptions before continuing; report to user

### 6b. Execute — Big Bang mode (`--big-bang`)

For each task or group: invoke `kanban-run` directly. No refine or verify steps.
Use only when all tasks were fully refined before the batch started.

**Sequential group**: invoke Skill tool for each task in order.

**Parallel group**: invoke Skill tool for all tasks concurrently (single message, multiple Skill calls). After group completes:
```bash
git status --porcelain
git diff --check  # detect conflict markers
```
If conflict markers found: stop and report which tasks conflicted.

**After each task or group**: re-read task status from API before continuing.

### 7. Stop conditions

- Requirement ambiguity requiring user input
- Repeated review/test failure (circuit breaker inside `kanban-run`)
- Conflicting code changes between parallel tasks
- A task exits the normal path and needs a product decision
- Parallel group partial failure: wait for all in-progress tasks to finish, then stop. Report succeeded vs. failed.

### 8. Early stop summary

- Completed task IDs
- Current blocker and which task caused it
- Exact resume point: `Resume with: /kanban-batch-run resume <next-ID>`

### 9. Completion summary

- Completed IDs in order
- Whether any groups were parallelized
- Key interfaces/schemas confirmed during verify steps (useful for next epic)
- Resulting commits

---

## Inner Task Contract

### Refine invocation

```
Skill(skill="kanban-refine", args="<ID>")
```

kanban-refine handles prior context detection internally. No extra args needed.

### Implement invocation (level-aware)

| Level | Default mode | `--auto` flag |
|-------|-------------|---------------|
| L1 | `Skill(skill="kanban-run", args="<ID> --auto")` | same |
| L2 | `Skill(skill="kanban-run", args="<ID>")` | `Skill(skill="kanban-run", args="<ID> --auto")` |
| L3 | `Skill(skill="kanban-run", args="<ID>")` | `Skill(skill="kanban-run", args="<ID> --auto")` |

In default mode, L2/L3 tasks pause for user confirmation at review checkpoints.

### Result verification

```bash
STATUS=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT&fields=status" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
```

| Status | Interpretation | Action |
|--------|---------------|--------|
| `done` | Completed successfully | Continue to Verify, then next task |
| `todo`, `plan`, `impl` | Circuit breaker or rejection | Stop batch, report blocker |
| `plan_review`, `impl_review` | Review pending (unexpected in `--auto`) | Stop batch, report |

### Rules

- Never re-implement `kanban-run` or `kanban-refine` logic. Always invoke via Skill tool.
- Never skip the Refine step in rolling wave mode, even if the task description looks complete — prior implementation context may change the scope.
- If a task blocks, the status check surfaces it — stop and report the exact resume task.
- For parallel groups, issue multiple Skill calls in a single message.

---

## Execution Notes

- Be conservative. This skill is for throughput, not shortcuts.
- Treat shared routes, server loaders, types, and top-level navigation as dependency hotspots — keep those sequential.
- Re-check the worktree between tasks. File changes from one task are expected to affect the next in a sequential chain.
- Only parallelize when the batch planner can justify it in one sentence.
- Rolling wave adds refine+verify overhead per task, but prevents rework from stale assumptions — net faster for epics with inter-task dependencies.

---

## Output Style

Start with the resolved plan:
- Ordered task list
- Proposed grouping (sequential vs parallel)
- Mode: Rolling Wave or Big Bang
- One-line reason per group
- Skipped tasks (if any)

During execution, print per-task progress:
```
Refine  #201 — scope locked (prior: POST /api/items interface confirmed)
Impl    #201 — done (commit: a1b2c3)
Verify  #201 — confirmed: items table schema, POST /api/items → {id, name}
Refine  #202 — scope updated: builds on items table from #201
Impl    #202 — done (commit: d4e5f6)
Verify  #202 — confirmed: ItemCard component at src/components/ItemCard.tsx
...
```

End with batch summary and resume point if stopped early.
