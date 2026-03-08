# Parallel Rules

Use these rules when deciding whether a batch can open more than one task at once.

## Strong signals

### Always sequential

- Different `phase:N` tags
- `Depends on:` points to another task in the batch
- `Parallel-safe: no`
- Shared navigation, shared route, shared loader, shared schema, shared public type, shared API contract

### Parallel candidates

- Same phase
- No dependency edges in either direction
- `Parallel-safe: yes`
- `Touches:` domains are distinct
- Tags and titles point to separate modules or surfaces

## Heuristic fallbacks

If the task has no explicit metadata:

1. Parse `phase:N` from tags.
2. Parse tags after removing generic markers such as:
   - `phase:*`
   - `explore-*`
   - `sprint*`
3. Infer module hints from title words and tags.
4. If module boundaries are unclear, stay sequential.

## Dependency hotspots

Assume sequential if more than one task touches any of these areas:

- top-level routes in `app/`
- shared shell/layout/navigation
- shared server data loader
- public types in `types/`
- shared API endpoints
- shared DB schema / migration flow

## Output requirements

The planner should emit:

- ordered task list
- candidate groups
- `sequential` or `parallel_candidate`
- one-line reason for each group

Examples:

- `500 -> 501 sequential: phase 2 depends on phase 1 browse data contract.`
- `610 + 611 parallel_candidate: same phase, explicit Parallel-safe: yes, distinct touches.`
