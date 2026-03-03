---
name: kanban-run
description: Run the AI team pipeline for kanban tasks — orchestration loop with 6 agents (Planner, Critic, Builder, Shield, Inspector, Ranger), single-step execution, and code review. Use /kanban-run to execute tasks through the 7-column pipeline.
license: MIT
---

> Shared context: read `~/.claude/skills/kanban/shared.md` for pipeline levels, status transitions, API endpoints, error handling, and agent context flow.
> Schema: read `~/.claude/skills/kanban/schema.md` for full DB schema, column descriptions, and JSON field formats.

## Commands

### `/kanban-run step <ID>` — Single Step

Execute only the next pipeline step then exit. Same logic as `/kanban-run` but no loop.

### `/kanban-run <ID> [--auto]` — Run Full Pipeline

**Default**: pause for user confirmation at Plan Review and Impl Review approvals.
**`--auto`**: fully automatic (circuit breaker still fires).

#### Orchestration Loop (Level-Aware)

```
L1 Quick:
  todo → Worker(opus) implements → commit → done

L2 Standard:
  todo → Plan Agent(opus) → impl (skip plan_review)
  impl → Worker(opus) + TDD Tester(sonnet) → impl_review
  impl_review → Code Review → [user confirm] → commit → done / reject → impl

L3 Full:
  todo → Plan Agent(opus) → plan_review
  plan_review → Review Agent(sonnet) → [user confirm] → impl / reject → plan
  impl → Worker(opus) + TDD Tester(sonnet) → impl_review
  impl_review → Code Review(sonnet) → [user confirm] → test / reject → impl
  test → Test Runner(sonnet) → pass → commit → done / fail → impl

Circuit breaker: plan_review_count > 3 OR impl_review_count > 3 → stop, ask user
```

Read the task's `level` field first to determine which steps to execute.

#### Implementation

```bash
# 1. Read current task state (status + level only)
TASK=$(curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT&fields=status,level")
STATUS=$(echo "$TASK" | jq -r '.status')

# 2. Dispatch agent (see Agent Dispatch below)
# 3. After agent: append to agent_log (see schema.md for format)
# 4. Re-read state, loop until done or circuit breaker
```

#### Agent Nicknames & Identity

Each agent has a fixed **nickname** used consistently across all records. The task card becomes a work log — every field and every log entry is signed.

| Nickname | Role | Model | Status trigger |
|----------|------|-------|----------------|
| `Planner` | Plan Agent | `opus` | `todo` |
| `Critic` | Plan Review Agent | `sonnet` | `plan_review` |
| `Builder` | Worker Agent | `opus` | `impl` (step 1) |
| `Shield` | TDD Tester | `sonnet` | `impl` (step 2) |
| `Inspector` | Code Review Agent | `sonnet` | `impl_review` |
| `Ranger` | Test Runner | `sonnet` | `test` |

> See `~/.claude/skills/kanban/schema.md` for JSON formats and the Signature Header Rule.

#### Agent Dispatch

Template files are at `~/.claude/skills/kanban/templates/`.

| Status | Template | Nickname | Model |
|--------|----------|----------|-------|
| `todo` | `templates/plan-agent.md` | `Planner` | `opus` |
| `plan_review` | `templates/review-agent.md` | `Critic` | `sonnet` |
| `impl` step 1 | `templates/worker-agent.md` | `Builder` | `opus` |
| `impl` step 2 | `templates/tdd-tester.md` | `Shield` | `sonnet` |
| `impl_review` | `templates/code-review-agent.md` | `Inspector` | `sonnet` |
| `test` | `templates/test-runner.md` | `Ranger` | `sonnet` |

**Agent minimum fields (fetch only what each agent needs):**

| Nickname | Required Fields |
|----------|----------------|
| `Planner` | `title,description` |
| `Critic` | `title,description,plan,decision_log,done_when` |
| `Builder` | `title,description,plan,done_when,plan_review_comments` |
| `Shield` | `title,description,implementation_notes` |
| `Inspector` | `title,description,plan,done_when,implementation_notes` |
| `Ranger` | `title,implementation_notes` |

**Dispatch procedure — execute in this order for every agent:**

```
① Read task fields (use per-agent fields to minimize token usage)
   # Planner
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description
   # Critic
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,plan,decision_log,done_when
   # Builder
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,plan,done_when,plan_review_comments
   # Shield
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,implementation_notes
   # Inspector
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,description,plan,done_when,implementation_notes
   # Ranger
   TASK = curl GET /api/task/$ID?project=$PROJECT&fields=title,implementation_notes
   Extract only the fields listed above for each agent

② Mark agent as active
   curl PATCH /api/task/$ID  →  { "current_agent": "<Nickname>" }

③ Read template file
   Read tool: ~/.claude/skills/kanban/templates/<agent>.md

④ Fill placeholders in template
   Replace every occurrence of:
     <ID>                     → actual task ID
     <PROJECT>                → actual project name
     <title>                  → task title
     <description>            → task description (requirements)
     <plan>                   → plan field value
     <decision_log>           → decision_log field value
     <done_when>              → done_when field value
     <implementation_notes>   → implementation_notes field value
     <plan_review_comments>   → plan_review_comments field value
     <TIMESTAMP>              → current UTC time (ISO 8601)

⑤ Launch Task tool with filled prompt
   Task(
     subagent_type = "general-purpose",
     model         = "<opus|sonnet>",   ← from the table above
     prompt        = <filled template content>
   )

⑥ After Task completes — append signed entry to agent_log
   (use schema.md › "Appending to agent_log" snippet,
    set agent=<Nickname>, model=<model>, message=<summary>)
```

After Builder + Shield both complete, move to `impl_review`:
```bash
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "impl_review", "current_agent": null}'
```

**Default mode**: after `plan_review` and `impl_review` agents complete, ask user with AskUserQuestion to accept/reject before advancing.
**Auto mode (`--auto`)**: auto-accept the agent's decision.

#### → Done Transition (all levels)

```bash
# 1. Commit pending changes
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A
  git commit -m "feat: <TITLE> [kanban #<ID>]"
fi
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")

# 2. Move to done
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "done"}'

# 3. Record commit hash in notes
curl -s -X POST "http://localhost:5173/api/task/$ID/note?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d "{\"content\": \"Commit: $COMMIT_HASH\"}"
```

If no commits yet, skip note or record `"Commit: (none)"`.

### `/kanban-run review <ID>` — Code Review

Trigger Code Review agent for a task in `impl_review` status (same as impl_review step).
