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
- Invoke `kanban-run` and `kanban-refine` for each task via the Skill tool when available.
- In Codex environments without the Skill tool, invoke via `$kanban-run ...` / `$kanban-refine ...` directly.
- Do not emulate or re-implement either pipeline.

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
- **Rolling wave + parallel**: run refine steps for a parallel group concurrently, then implement concurrently. Verify sequentially.

### 6. Execute — Rolling Wave Loop (default)

For each task N in order:

```
A. Refine(N)
   - Skill(skill="kanban-refine", args="<ID>")  [Codex: $kanban-refine <ID>]
   - kanban-refine auto-detects the prior card (N-1) via "Depends on:" tags or asks one question.
   - Reads N-1's implementation_notes + actual codebase to ground N's description.
   - First task in the batch (no prior card): regular user interview.

   Card split check (before invoking kanban-refine):
   - If scope exceeds limits (AC > 5, files > 5, multi-layer), split first:
     1. Create sub-cards via kanban API
     2. Replace N in execution order with N-a, N-b, N-c
     3. Report split to user, continue automatically

B. Implement(N)
   - Invoke kanban-run (level-aware, see Inner Task Contract)

C. Verify(N)
   - Check actual implementation: git diff, created/modified files, test results
   - Add kanban note: curl POST /api/task/$ID/note → "Verified: [confirmed interface/schema]"
   - Note anything that will affect N+1's refinement scope

→ Move to N+1
```

**Loop exceptions:**
- Split triggered during Refine → insert sub-cards, continue
- Circuit breaker or blocker during Implement → stop, report resume point
- Unexpected design change during Verify → update downstream task descriptions; report to user

### 6b. Execute — Big Bang mode (`--big-bang`)

Invoke `kanban-run` directly per task. No refine or verify steps.
Use only when all tasks were fully refined before the batch started.

**Sequential**: invoke for each task in order.

**Parallel**: invoke for all tasks in the group concurrently.
- Claude: multiple Skill tool calls in one message.
- Codex: multiple `$kanban-run ...` only if runtime supports concurrent execution; otherwise sequential.

After parallel group:
```bash
git status --porcelain
git diff --check
```
If conflict markers found: stop, report which tasks conflicted.

After each task or group: re-read task status from API before continuing.

### 7. Stop conditions

- Requirement ambiguity requiring user input
- Repeated review/test failure (circuit breaker inside `kanban-run`)
- Conflicting code changes between parallel tasks
- Task exits normal path and needs a product decision
- Parallel group partial failure: wait for in-progress tasks to finish, then stop. Report succeeded vs. failed.

### 8. Early stop summary

- Completed task IDs
- Current blocker and which task caused it
- Resume point: `Resume with: /kanban-batch-run resume <next-ID>`

### 9. Completion summary

- Completed IDs in order
- Whether any groups were parallelized
- Key interfaces/schemas confirmed during verify steps (useful for next epic)
- Resulting commits

---

## Execution Notes

- Be conservative. This skill is for throughput, not shortcuts.
- Never implement a task freehand and patch kanban state afterward — drive every task through `kanban-run`.
- Treat shared routes, server loaders, types, and top-level navigation as dependency hotspots — keep sequential.
- Re-check the worktree between tasks.
- Only parallelize when the batch planner can justify it in one sentence.
- Rolling wave adds refine+verify overhead per task, but prevents rework from stale assumptions — net faster for epics with inter-task dependencies.

---

## Inner Task Contract

### Refine invocation

```
Skill(skill="kanban-refine", args="<ID>")   # Claude
$kanban-refine <ID>                          # Codex fallback
```

kanban-refine handles prior context detection internally. No extra args needed.

### Implement invocation (level-aware)

| Level | Claude default | Claude `--auto` | Codex default | Codex `--auto` |
|-------|---------------|-----------------|---------------|----------------|
| L1 | `Skill("kanban-run", "<ID> --auto")` | same | `$kanban-run <ID> --auto` | same |
| L2 | `Skill("kanban-run", "<ID>")` | `Skill("kanban-run", "<ID> --auto")` | `$kanban-run <ID>` | `$kanban-run <ID> --auto` |
| L3 | `Skill("kanban-run", "<ID>")` | `Skill("kanban-run", "<ID> --auto")` | `$kanban-run <ID>` | `$kanban-run <ID> --auto` |

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

- Never re-implement `kanban-run` or `kanban-refine`. Always invoke via Skill tool or Codex `$` command fallback.
- Never skip Refine in rolling wave mode — prior implementation context may change scope.
- If a task blocks, status check surfaces it — stop and report exact resume task.
- For parallel groups, issue multiple invocations in a single message.

---

## Output Style

Start with the resolved plan:
- Ordered task list, proposed grouping, mode (Rolling Wave or Big Bang), one-line reason per group, skipped tasks

During execution:
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
