---
name: kanban-batch-run
description: Run multiple kanban tasks end-to-end in planned order using the existing kanban and kanban-run workflows. Use when the user wants a batch such as `500-504`, `500,501,504`, or a short ordered task list executed automatically, with conservative sequencing by default and parallel execution only when tasks are clearly independent.
---

# Kanban Batch Run

Execute several kanban tasks as one orchestrated batch. Expand task ranges, sort them by phase, run them one after another, and only open parallel lanes when independence is explicit and low-risk.

## Inputs

- Accept task selectors like `500-504`, `500,501,504`, or whitespace-separated IDs.
- Read `../kanban/shared.md` before any API call.
- Reuse the existing `kanban-run` workflow semantics; this skill orchestrates batches, not a new pipeline.

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

1. Resolve the current project from `.codex/kanban.json` or `.claude/kanban.json`.
2. Run:

   ```bash
   python3 scripts/plan_batch.py --project "$PROJECT" --tasks "<selector>"
   ```

3. Read the returned task list and proposed groups.
4. Validate ordering:
   - Respect `phase:N` tags when present.
   - If tasks were user-ordered but phase tags disagree, prefer phase order and say so.
   - Skip tasks not in `todo` unless the user explicitly asked to include in-progress items.
5. Decide execution mode:
   - Default: sequential.
   - Allow parallel only if all of these are true:
     - same phase or no phase tag
     - no task description says it depends on another task in the batch
     - titles/tags/descriptions point to distinct modules or surfaces
     - failure in one task would not invalidate another task's work
   - If any doubt remains, stay sequential.
   - Prefer explicit `Depends on:` / `Parallel-safe:` metadata over heuristic guesses.
6. Execute each group:
   - For a sequential group, run tasks one by one with the same behavior you would use for `/kanban-run <ID>`.
   - For a parallel group, run the independent tasks concurrently, but report them as one batch stage.
   - After each task or group, refresh board/task state before continuing.
7. Stop the batch if any of these happen:
   - requirement ambiguity that needs the user
   - repeated review/test failure
   - conflicting code changes between parallel tasks
   - a task exits the normal path and needs a product decision
8. When stopped early, summarize:
   - completed tasks
   - current blocker
   - exact next task to resume from
9. When finished, summarize:
   - completed IDs in order
   - whether any groups were parallelized
   - resulting commits / verification if applicable

## Execution Notes

- Be conservative. This skill is for throughput, not bravado.
- For exploration-generated chains like `500-504`, assume sequential unless the phase model proves otherwise.
- Do not invent hidden dependencies, but do not ignore obvious ones either.
- If a prior task creates data contracts, routes, or shared components used by later tasks, keep the chain sequential.
- Re-check the worktree between tasks. If one task changed files the next task also needs, that is expected in a sequential chain.
- Treat shared routes, shared server loaders, shared types, and shared top-level navigation as dependency hotspots.
- Only parallelize when the batch planner can explain the decision in one sentence.

## Output Style

- Start with the resolved plan:
  - ordered tasks
  - proposed grouping
  - whether execution will be sequential or mixed
  - one-line reason per group
- Then execute.
- End with a short batch summary plus the next resume point if the batch stopped early.
