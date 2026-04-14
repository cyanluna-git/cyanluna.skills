---
name: project-kickstart
description: Full project pipeline — SRS → Plan → Tasks + TDD → Rolling Wave Execute. Use when starting a new project or major feature from scratch. Default mode is Rolling Wave (implement one → verify → refine next → repeat). Use --big-bang for old all-upfront refine style.
user_invocable: true
---

# `/project-kickstart [topic]` — Full Project Pipeline

Runs the complete project lifecycle from idea to rolling implementation.

**Default mode: Rolling Wave Planning**
```
① SRS
② Implementation Plan
③ Create all tasks — title + high-level description only (lightweight skeleton)
④ Lock execution order (dependency graph)
⑤ Rolling Wave Loop:
     refine(N) → implement(N) → verify(N) → refine(N+1) → implement(N+1) → ...
```

**`--big-bang` mode** (legacy, small projects only):
```
① SRS → ② Plan → ③ Tasks → ④ Refine all → ⑤ Batch plan → ⑥ Batch execute
```

---

## What is Rolling Wave Planning?

> **Rolling Wave Planning** (PMBOK): Plan near-term work in detail; keep future work high-level. Refine each task only after the previous one is implemented and verified — using real implementation outcomes to inform the next refinement.
> Related: Progressive Elaboration, Just-in-Time (JIT) Refinement

Key principle: **refine task N+1 only after verifying task N's actual implementation.**

- Refining everything upfront → earlier implementations change assumptions, later tasks become stale
- Refining just-in-time → scope and interfaces are grounded in real code

---

## When to use

- Starting a new project
- Large feature additions (3+ tasks)
- Any "let's build this" request that needs structure end-to-end

---

## Procedure (Default: Rolling Wave)

### ① SRS

1. If topic is underspecified, ask 1-2 clarifying questions via AskUserQuestion
2. Explore codebase if needed (Explore agent)
3. Write SRS:

```markdown
# [Project Name] — Software Requirements Specification

## 1. Background & Motivation
## 2. Goals & Non-Goals
## 3. Scope
## 4. Functional Requirements
   - FR-1: ...
   - FR-2: ...
## 5. Non-Functional Requirements
   - Performance, Security, Compatibility
## 6. Architecture Overview
   - System diagram / Component breakdown / Data flow
## 7. Technology Stack
## 8. Constraints & Assumptions
## 9. Risk Assessment
## 10. Success Criteria
```

4. Save: `docs/srs-{project-slug}.md`
5. Present summary to user and get approval before continuing

---

### ② Implementation Plan

```markdown
# [Project Name] — Implementation Plan

## Epic / Story structure
## Dependency graph (which card must follow which)
## Phase order
## Estimated size (stories, tests, LOC)
```

Save: `docs/implementation-plan-{project-slug}.md`

---

### ③ Create all tasks — Lightweight skeleton

**Do not write detailed descriptions upfront in Rolling Wave.**
Create skeleton tasks: title + 1-2 line goal only. Acceptance Criteria left blank — filled during Refine.

Minimum fields per task:
- `title`: clear unit of work
- `description`: Goal (1-2 lines) + Scope keywords only
- `tags`: epic and phase tags
- `level`: L1/L2/L3 based on implementation plan

```bash
curl -s -X POST "$BASE_URL/api/task" \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "...",
    "project": "$PROJECT",
    "priority": "high",
    "level": 2,
    "description": "## Goal\nOne-line goal\n\n## Scope\n- In: ...\n- Out: ...",
    "tags": "phase:1,epic:auth"
  }'
```

**E2E test task**: add one E2E validation task at the end of each epic (required).

Print full ID list and order after creation.

---

### ④ Lock execution order

Finalize execution sequence based on dependency graph:

```markdown
# Rolling Wave Execution Order

Phase 1: #id1 → #id2 → #id3
Phase 2: #id4 → #id5
Phase 3: #id6 (E2E)

Dependency notes:
- #id2 depends on #id1's API interface
- #id4 depends on #id3's DB schema
```

Save: `docs/execution-order-{project-slug}.md`

Confirm order with user before starting the loop.

---

### ⑤ Rolling Wave Loop

**Repeat until all tasks are done:**

```
for each task N in execution order:

  A. Refine(N)
     - Read prior task (N-1) actual implementation from codebase
     - Elaborate N's description based on confirmed interfaces/schema/components from N-1
     - Add: Acceptance Criteria, Edge Cases, code reference paths
     - Call /kanban-refine #N or directly PATCH description

     **Card split rules (auto-applied during Refine)**:
     Split if any of these are true:
     - Acceptance Criteria exceeds 5 items
     - Expected file changes exceed 5 files
     - Touches multiple layers simultaneously (e.g. DB + API + UI)
     - Estimated to exceed one session (~30–60 min)

     Split procedure:
     1. Break N into 2–3 sub-cards (create via kanban API)
     2. Delete or convert original N to an epic description card
     3. Insert sub-cards into execution order (N-a, N-b, N-c)
     4. Report split to user, then continue automatically

  B. Implement(N)
     - Run /kanban-run #N
     - Pipeline: plan → (plan_review) → impl → (impl_review) → (test) → done

  C. Verify(N)
     - Inspect actual output: git diff, created files, test results
     - Note any changes that affect subsequent task refinements
     - Add kanban note: "Impact on next tasks: ..."

  → Move to N+1
```

**Loop exceptions:**
- Unexpected implementation change found during Verify → adjust downstream task descriptions proactively
- Blocker encountered → report to user and pause
- E2E task fails → review tasks in that epic

---

## Execution Options

### (default) — Rolling Wave
Sequential: refine → implement → verify → refine next.
For L2/L3 tasks: pause at plan_review / impl_review for user confirmation.

### `--auto`
Auto-approve all implement stages. Refine and Verify always run.

### `--plan-only`
Run steps ①–④ only. Lock execution order, do not start the loop.
User manually triggers each task later with `refine → /kanban-run #N`.

### `--big-bang`
Legacy all-upfront: refine all tasks at once, then batch execute.
Use only for small projects (≤3 tasks) with no inter-task dependencies.

---

## Guardrails

- Never create tasks without SRS
- Every epic must have at least one E2E test task
- In Rolling Wave: N+1 refine must happen after N is verified — no exceptions
- Never refine the next card without checking the prior card's actual implementation
- No large implementations in a single card — split immediately when scope exceeds limits during Refine
- Card splits proceed automatically; report to user after splitting
- Run /kanban-init first if project is not registered

---

## Output

Print progress after each step:

```
✅ ① SRS: docs/srs-project.md (12 requirements)
✅ ② Plan: docs/implementation-plan-project.md (3 epics, 8 stories)
✅ ③ Tasks: #201–#208 (8 skeleton tasks created)
✅ ④ Order: docs/execution-order-project.md (Phase 1→2→3)

Rolling Wave Loop:
  ✅ Refine #201 — scope locked from codebase
  ✅ Impl  #201 — done (commit: a1b2c3d)
  ✅ Verify #201 — confirmed: POST /api/items interface
  ✅ Refine #202 — scope updated based on #201 interface
  ✅ Impl  #202 — done (commit: d4e5f6a)
  ✅ Verify #202 — confirmed: items table schema
  ⏳ Refine #203 — in progress...
```
