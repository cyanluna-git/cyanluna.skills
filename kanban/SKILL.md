---
name: kanban
description: Manage project tasks in per-project kanban DBs (~/.claude/kanban-dbs/{project}.db). Supports 7-column AI team pipeline (Req → Plan → Review Plan → Impl → Review Impl → Test → Done), session context persistence, task CRUD, lifecycle documentation, and automated code review. Run /kanban-init first to register the project.
license: MIT
---

Manages project tasks in **per-project** SQLite databases at `~/.claude/kanban-dbs/{project}.db`.
Each project gets its own DB file — no WAL conflicts when multiple PCs work on different projects simultaneously.

## DB Path & Project Config

Read project config from `.claude/kanban.json` (created by `/kanban-init`):

```bash
CONFIG=$(cat .claude/kanban.json 2>/dev/null)
PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")
DB="$HOME/.claude/kanban-dbs/${PROJECT}.db"
```

If `.claude/kanban.json` doesn't exist, prompt user to run `/kanban-init`, or fall back to `basename "$(pwd)"`.

## Pipeline Levels

| Level | Path | Use Case |
|-------|------|----------|
| L1 Quick | `Req → Impl → Done` | File cleanup, config changes, typo fixes |
| L2 Standard | `Req → Plan → Impl → Review → Done` | Feature edits, bug fixes, refactoring |
| L3 Full | `Req → Plan → Plan Rev → Impl → Impl Rev → Test → Done` | New features, architecture changes |

Level is set at task creation and stored in the `level` column.

## 7-Column AI Team Pipeline

```
Req → Plan → Review Plan → Impl → Review Impl → Test → Done
```

| Column | Status | Agent | Model |
|--------|--------|-------|-------|
| Req | `todo` | User | - |
| Plan | `plan` | Plan Agent | opus (Task) |
| Review Plan | `plan_review` | Review Agent | sonnet (Task) |
| Impl | `impl` | Worker → TDD Tester (sequential) | opus → sonnet |
| Review Impl | `impl_review` | Code Review Agent | sonnet (Task) |
| Test | `test` | Test Runner | sonnet (Task) |
| Done | `done` | - | - |

### Valid Status Transitions

```
todo        → plan
plan        → plan_review, impl (L2: skip review), todo
plan_review → impl (approve), plan (reject)
impl        → impl_review
impl_review → test (approve), impl (reject)
test        → done (pass), impl (fail)
done        → (terminal)
```

## DB Access

Priority: **HTTP API** (`http://localhost:5173`) → **sqlite3 CLI**

> **IMPORTANT**: Do NOT use `python3 -c "import sqlite3..."` for DB access. Always use the `sqlite3` CLI at `/usr/bin/sqlite3`.

```bash
# Read
sqlite3 -json ~/.claude/kanban-dbs/$PROJECT.db \
  "SELECT id, title, status, priority FROM tasks WHERE project='$PROJECT' ORDER BY id"

# Update
sqlite3 ~/.claude/kanban-dbs/$PROJECT.db \
  "UPDATE tasks SET status='impl', started_at=datetime('now') WHERE id=$ID"
```

### API Endpoints

```bash
# Board
curl -s "http://localhost:5173/api/board?project=$PROJECT"

# Read task
curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT"

# Update task fields / status
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"plan": "...", "status": "plan_review"}'

# Create task
curl -s -X POST http://localhost:5173/api/task \
  -H 'Content-Type: application/json' \
  -d "{\"title\": \"...\", \"project\": \"$PROJECT\", \"priority\": \"medium\", \"level\": 3, \"description\": \"...\"}"

# Plan review result
curl -s -X POST "http://localhost:5173/api/task/$ID/plan-review?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "sonnet", "status": "approved", "comment": "..."}'

# Impl review result
curl -s -X POST "http://localhost:5173/api/task/$ID/review?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "sonnet", "status": "approved", "comment": "..."}'

# Test result
curl -s -X POST "http://localhost:5173/api/task/$ID/test-result?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"tester": "test-runner", "status": "pass", "lint": "...", "build": "...", "tests": "...", "comment": "..."}'

# Add note
curl -s -X POST "http://localhost:5173/api/task/$ID/note?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"content": "Commit: abc1234"}'

# Reorder
curl -s -X PATCH "http://localhost:5173/api/task/$ID/reorder?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "plan", "afterId": null, "beforeId": null}'

# Delete
curl -s -X DELETE "http://localhost:5173/api/task/$ID?project=$PROJECT"
```

> For full schema, column descriptions, and JSON field formats, read `~/.claude/skills/kanban/schema.md`.

## Commands

### `/kanban` or `/kanban list` — View Board

```bash
BOARD=$(curl -s "http://localhost:5173/api/board?project=$PROJECT")
```

Fallback (no dev server):
```bash
sqlite3 -header -column ~/.claude/kanban-dbs/$PROJECT.db \
  "SELECT id, title, status, priority FROM tasks WHERE project='$PROJECT' \
   ORDER BY CASE status WHEN 'impl' THEN 0 WHEN 'impl_review' THEN 1 \
   WHEN 'plan' THEN 2 WHEN 'plan_review' THEN 3 WHEN 'test' THEN 4 \
   WHEN 'todo' THEN 5 WHEN 'done' THEN 6 END, id"
```

Output: markdown table with ID, Status, Priority, Title.

### `/kanban context` — Session Handoff

**Run first when starting a new session.** Fetch board and output pipeline state:
Implementing / Plan Review / Impl Review / Testing / Recently Done / Next Todo.

### `/kanban add <title>` — Add Task

1. Ask user for priority, level (L1/L2/L3), description, tags (use AskUserQuestion)
2. POST to API, output confirmation with new task ID

### `/kanban move <ID> <status>` — Move Task

```bash
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d "{\"status\": \"$STATUS\"}"
```

The API enforces valid transitions. Invalid moves return 400 with allowed transitions.

### `/kanban step <ID>` — Single Step

Execute only the next pipeline step then exit. Same logic as `/kanban run` but no loop.

### `/kanban run <ID> [--auto]` — Run Full Pipeline

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
# 1. Read current task state
TASK=$(curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT")
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

**Dispatch procedure — execute in this order for every agent:**

```
① Read task fields
   TASK = curl GET /api/task/$ID?project=$PROJECT
   Extract: title, description, plan, implementation_notes, plan_review_comments

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

### `/kanban review <ID>` — Code Review

Trigger Code Review agent for a task in `impl_review` status (same as impl_review step).

### `/kanban edit <ID>` — Edit Task

Ask user which fields to modify, then PATCH via API.

### `/kanban remove <ID>` — Delete Task

```bash
# API (preferred)
curl -s -X DELETE "http://localhost:5173/api/task/$ID?project=$PROJECT"

# sqlite3 fallback
sqlite3 ~/.claude/kanban-dbs/$PROJECT.db "DELETE FROM tasks WHERE id=$ID;"
```

### `/kanban stats` — Statistics

```bash
BOARD=$(curl -s "http://localhost:5173/api/board?project=$PROJECT")
echo "$BOARD" | jq '{
  todo: (.todo | length), plan: (.plan | length),
  plan_review: (.plan_review | length), impl: (.impl | length),
  impl_review: (.impl_review | length), test: (.test | length),
  done: (.done | length),
  total: ((.todo + .plan + .plan_review + .impl + .impl_review + .test + .done) | length)
}'
```

## Error Handling

- **Agent failure**: 1 retry on first failure; 2nd failure → keep status, log to `agent_log`, notify user
- **Plan review loop**: `plan_review_count > 3` → circuit breaker, ask user
- **Impl review loop**: `impl_review_count > 3` → circuit breaker, ask user
- **Mid-pipeline crash**: preserve current status, log to `agent_log`, notify user
- In `--auto` mode: circuit breaker still fires, requires user intervention

## Agent Context Flow (Card = Work Record)

Each agent **signs their output** with a header: `> **Nickname** \`model\` · timestamp`
The `agent_log` accumulates the full chronological history of all agents who touched the task.

| Nickname | Reads | Writes (signed) | Moves to |
|----------|-------|-----------------|----------|
| `Planner` | `description` | `plan`, `decision_log` | `plan_review` |
| `Critic` | `description`, `plan`, `decision_log` | `plan_review_comments` | `impl` or `plan` |
| `Builder` | `description`, `plan`, `plan_review_comments` | `implementation_notes` | (none) |
| `Shield` | `description`, `implementation_notes` | `implementation_notes` (append) | `impl_review` |
| `Inspector` | `description`, `plan`, `implementation_notes` | `review_comments` | `test` or `impl` |
| `Ranger` | `implementation_notes` | `test_results` | `done` or `impl` |
| All agents | — | append signed entry to `agent_log` | — |

## Setup & Web Board

Run `/kanban-init` first to register this project.

Add to `.gitignore`:
```
.claude/kanban.json
kanban-board/
```

Start web board: `./kanban-board/start.sh` → `http://localhost:5173/?project=<PROJECT>`
Features: 7-column pipeline, drag-and-drop (valid transitions only), card lifecycle modal, agent log viewer, 10s auto-refresh.
