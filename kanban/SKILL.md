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
# Read project name
CONFIG=$(cat .claude/kanban.json 2>/dev/null)
PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")
DB="$HOME/.claude/kanban-dbs/${PROJECT}.db"
```

Per-project DB path (default when no config):
```
~/.claude/kanban-dbs/<project>.db
```

If `.claude/kanban.json` doesn't exist, prompt the user to run `/kanban-init` first, or fall back to `basename "$(pwd)"` as project name.

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  plan TEXT,
  implementation_notes TEXT,
  tags TEXT,
  review_comments TEXT,
  plan_review_comments TEXT,
  test_results TEXT,
  agent_log TEXT,
  current_agent TEXT,
  plan_review_count INTEGER NOT NULL DEFAULT 0,
  impl_review_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 3,
  attachments TEXT,
  notes TEXT,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  planned_at TEXT,
  reviewed_at TEXT,
  tested_at TEXT,
  completed_at TEXT
);
```

| Column | Type | Description |
|--------|------|-------------|
| `project` | TEXT | Project identifier. Uses `basename "$(pwd)"` |
| `status` | TEXT | `todo` / `plan` / `plan_review` / `impl` / `impl_review` / `test` / `done` |
| `priority` | TEXT | `high` / `medium` / `low` |
| `description` | TEXT | **Requirements** in markdown - what needs to be done |
| `plan` | TEXT | **Implementation plan** in markdown - how to do it |
| `implementation_notes` | TEXT | **Implementation log** in markdown - what was actually done |
| `tags` | TEXT | JSON array string (e.g., `'["api","ui","db"]'`) |
| `review_comments` | TEXT | JSON array of impl review comment objects |
| `plan_review_comments` | TEXT | JSON array of plan review comment objects |
| `test_results` | TEXT | JSON array of test result objects |
| `agent_log` | TEXT | JSON array of agent activity log entries |
| `current_agent` | TEXT | Currently active agent name |
| `plan_review_count` | INTEGER | Number of plan review iterations |
| `impl_review_count` | INTEGER | Number of impl review iterations |
| `level` | INTEGER | Pipeline level: 1 (Quick), 2 (Standard), 3 (Full) |
| `attachments` | TEXT | JSON array of attachment file names |
| `notes` | TEXT | JSON array of note objects |
| `rank` | INTEGER | Display order within column (drag-and-drop position) |

## Pipeline Levels

Tasks have a `level` (1-3) that determines the pipeline path:

| Level | Path | Use Case |
|-------|------|----------|
| L1 Quick | `Req → Impl → Done` | File cleanup, config changes, typo fixes |
| L2 Standard | `Req → Plan → Impl → Review → Done` | Feature edits, bug fixes, refactoring |
| L3 Full | `Req → Plan → Plan Rev → Impl → Impl Rev → Test → Done` | New features, architecture changes |

Level is set when creating a task (`/kanban add`) and stored in the `level` column.

## 7-Column AI Team Pipeline

```
Req → Plan → Review Plan → Impl → Review Impl → Test → Done
```

| Column | Status | Agent | Model | Writes to |
|--------|--------|-------|-------|-----------|
| Req | `todo` | User | - | `description` |
| Plan | `plan` | Plan Agent | opus (Task) | `plan` |
| Review Plan | `plan_review` | Review Agent | sonnet (Task) | `plan_review_comments` |
| Impl | `impl` | Worker → TDD Tester (sequential) | opus → sonnet | `implementation_notes` |
| Review Impl | `impl_review` | Code Review Agent | sonnet (Task) | `review_comments` |
| Test | `test` | Test Runner | sonnet (Task) | `test_results` |
| Done | `done` | - | - | - |

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

### Comment Formats

#### review_comments / plan_review_comments Format
```json
[
  {
    "reviewer": "sonnet",
    "status": "changes_requested",
    "comment": "## Review Findings\n\n1. Missing error handling\n2. Type safety issues",
    "timestamp": "2026-02-20T14:30:00.000Z"
  }
]
```

#### test_results Format
```json
[
  {
    "tester": "test-runner-agent",
    "status": "pass",
    "lint": "0 errors, 0 warnings",
    "build": "Build successful",
    "tests": "42 passed, 0 failed",
    "comment": "All checks passed",
    "timestamp": "2026-02-20T15:00:00.000Z"
  }
]
```

#### agent_log Format

**IMPORTANT**: Always include `model` field to track which AI model performed each step.

```json
[
  {
    "agent": "plan-agent",
    "model": "opus",
    "message": "Started planning for task #5",
    "timestamp": "2026-02-20T14:00:00.000Z"
  },
  {
    "agent": "review-agent",
    "model": "sonnet",
    "message": "Plan review completed: approved",
    "timestamp": "2026-02-20T14:05:00.000Z"
  }
]
```

Standard agent + model combinations:
| Agent | Model |
|-------|-------|
| `plan-agent` | `opus` |
| `worker-agent` | `opus` |
| `tdd-tester` | `sonnet` |
| `review-agent` | `sonnet` |
| `code-review-agent` | `sonnet` |
| `test-runner` | `sonnet` |

## DB Access

### Priority: HTTP API → sqlite3 CLI

1. **HTTP API** (preferred when kanban-board dev server is running): `http://localhost:5173`
2. **sqlite3 CLI** (when dev server is not running, or for direct queries/bulk ops): `sqlite3 ~/.claude/kanban-dbs/$PROJECT.db`

**IMPORTANT**: Do NOT use Python (`python3 -c "import sqlite3..."`) for DB access. Always use the `sqlite3` CLI command which is installed at `/usr/bin/sqlite3`.

```bash
# Quick read example
sqlite3 -json ~/.claude/kanban-dbs/$PROJECT.db "SELECT id, title, status, priority FROM tasks WHERE project='$PROJECT' ORDER BY id"

# Quick update example
sqlite3 ~/.claude/kanban-dbs/$PROJECT.db "UPDATE tasks SET status='impl', started_at=datetime('now') WHERE id=$ID"
```

Base URL: `http://localhost:5173` (default kanban-board port)

### API Endpoints

```bash
# Read task (scans all project DBs automatically)
curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT" | jq .

# Read board
curl -s "http://localhost:5173/api/board?project=$PROJECT" | jq .

# Update task (fields + status) — project param required
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"plan": "...", "status": "plan_review"}'

# Create task — body.project required
curl -s -X POST http://localhost:5173/api/task \
  -H 'Content-Type: application/json' \
  -d "{\"title\": \"...\", \"project\": \"$PROJECT\", \"priority\": \"medium\", \"description\": \"...\"}"

# Plan review result — project param required
curl -s -X POST "http://localhost:5173/api/task/$ID/plan-review?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "sonnet", "status": "approved", "comment": "Plan looks good"}'

# Impl review result — project param required
curl -s -X POST "http://localhost:5173/api/task/$ID/review?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "sonnet", "status": "approved", "comment": "Code looks good"}'

# Test result — project param required
curl -s -X POST "http://localhost:5173/api/task/$ID/test-result?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"tester": "test-runner", "status": "pass", "lint": "...", "build": "...", "tests": "...", "comment": "..."}'

# Reorder / drag-and-drop — project param required
curl -s -X PATCH "http://localhost:5173/api/task/$ID/reorder?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "plan", "afterId": null, "beforeId": null}'
```

## Commands

### View Board (Default)
`/kanban` or `/kanban list`

Read the board via API and output as a markdown table:
```bash
BOARD=$(curl -s "http://localhost:5173/api/board?project=$PROJECT")
```

Output format:
```
### PROJECT Kanban Board

| ID | Status | Priority | Title |
|----|--------|----------|-------|
| 3  | impl | high | Category Rules UI |
| 7  | impl_review | medium | API Error Handling |
| 1  | todo | medium | Monthly Budget |
| 10 | done | - | Expense Flag |
```

If the kanban-board dev server is not running, fall back to sqlite3:
```bash
sqlite3 -header -column ~/.claude/kanban-dbs/$PROJECT.db \
  "SELECT id, title, status, priority FROM tasks WHERE project='$PROJECT' ORDER BY CASE status WHEN 'impl' THEN 0 WHEN 'impl_review' THEN 1 WHEN 'plan' THEN 2 WHEN 'plan_review' THEN 3 WHEN 'test' THEN 4 WHEN 'todo' THEN 5 WHEN 'done' THEN 6 END, id"
```

### Context (Session Handoff)
`/kanban context`

**Run this first when starting a new session.** Shows pipeline state across all columns:
```bash
BOARD=$(curl -s "http://localhost:5173/api/board?project=$PROJECT")
# or without project to see all projects:
BOARD=$(curl -s "http://localhost:5173/api/board")
```

Output format:
```
### Pipeline Status

🔨 Implementing
- [#3] Category Rules UI (high)
  Plan: ...
  Implementation Notes: ...

🔍 Plan Review
- [#5] New Feature (medium)
  Plan Review: approved by sonnet

📝 Impl Review
- [#7] API Error Handling (medium)
  Latest review: changes_requested - "Need error handling"

🧪 Testing
- [#8] Auth Module (high)
  Test: pass - lint OK, build OK, 42/42 tests

✅ Recently Done
- [#10] Expense Flag (2026-02-20)

📋 Next To Do
- [#1] Monthly Budget (medium)
```

### Add Task
`/kanban add <title>`

1. Ask the user for priority, level (L1/L2/L3), description, and tags (use AskUserQuestion)
2. Create via API:
```bash
curl -s -X POST http://localhost:5173/api/task \
  -H 'Content-Type: application/json' \
  -d "{\"title\": \"$TITLE\", \"project\": \"$PROJECT\", \"priority\": \"$PRIORITY\", \"level\": $LEVEL, \"description\": \"$DESC\"}"
```
3. Output confirmation with the new task ID

### Move Task
`/kanban move <ID> <status>`

```bash
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d "{\"status\": \"$STATUS\"}"
```

The API enforces valid transitions. Invalid moves return 400 with allowed transitions.

### Run Pipeline
`/kanban run <ID>` — Execute the full AI team pipeline for a task

**Default mode**: Pauses for user confirmation at Plan Review approval and Impl Review approval.
**Auto mode**: `/kanban run <ID> --auto` — Fully automatic (no pauses except circuit breaker).

#### Pipeline Loop (Level-Aware)

The pipeline path depends on the task's `level`:

```
L1 Quick:
  1. todo → Worker(opus) implements → done
  Complete!

L2 Standard:
  1. todo → Plan Agent (opus) → impl (skip plan_review)
  2. impl → Worker(opus) then TDD Tester(sonnet) → impl_review
  3. impl_review → Code Review → user confirm → approve:done / reject:impl
  4. done → Complete!

L3 Full:
  1. todo → Plan Agent (opus) → plan_review
  2. plan_review → Review Agent → user confirm → approve:impl / reject:plan
  3. impl → Worker(opus) then TDD Tester(sonnet) → impl_review
  4. impl_review → Code Review → user confirm → approve:test / reject:impl
  5. test → Test Runner(sonnet) → pass:done / fail:impl
  6. done → Complete!

Circuit breaker: plan_review_count > 3 OR impl_review_count > 3 → stop and ask user
```

Read the task's `level` field first to determine which steps to execute.

#### Implementation

1. **Read current task state**:
```bash
TASK=$(curl -s http://localhost:5173/api/task/$ID)
STATUS=$(echo "$TASK" | jq -r '.status')
```

2. **Execute appropriate agent based on current status** (see Agent Dispatch below)

3. **Loop until done or blocked**:
   - After each agent completes, re-read task state
   - If status progressed, continue to next agent
   - If review rejected, loop back automatically
   - If circuit breaker triggers, stop and notify user

4. **After each agent completes, orchestrator appends to agent_log**:
```bash
python3 -c "
import subprocess, json, datetime
d = json.loads(subprocess.run(['curl','-s','http://localhost:5173/api/task/$ID?project=$PROJECT'], capture_output=True, text=True).stdout)
log = json.loads(d.get('agent_log') or '[]')
log.append({'agent':'AGENT_NAME','model':'MODEL','message':'MESSAGE','timestamp':datetime.datetime.utcnow().isoformat()+'Z'})
subprocess.run(['curl','-s','-X','PATCH','http://localhost:5173/api/task/$ID?project=$PROJECT','-H','Content-Type: application/json','-d',json.dumps({'agent_log':json.dumps(log)})], capture_output=True)
"
```

#### Agent Dispatch

Based on task status, dispatch the appropriate agent:

**`todo` → Plan Agent**:
```
Use Task tool: model="opus", subagent_type="general-purpose"
```

Plan Agent prompt:
```
You are a Plan Agent for Kanban task #<ID>.

## Task Info
- Title: <title>
- Requirements: <description>

## Your Job
1. Read the requirements carefully
2. Analyze the codebase to understand the current state
3. Create a detailed implementation plan in markdown
4. Write the plan to the task card via API

## Output
Write a markdown plan with:
- Files to modify/create
- Step-by-step approach
- Key design decisions
- Edge cases to handle

## Record Results
curl -s -X PATCH "http://localhost:5173/api/task/<ID>?project=<PROJECT>" \
  -H 'Content-Type: application/json' \
  -d '{"plan": "<PLAN_MARKDOWN>", "status": "plan_review", "current_agent": "plan-agent"}'
```

**`plan_review` → Review Agent (sonnet)**:

```
Use Task tool: model="sonnet", subagent_type="general-purpose"
```

Review Agent prompt:
```
You are a Review Agent for Kanban task #<ID>.

## Task Info
- Title: <title>
- Requirements: <description>
- Plan: <plan>

## Your Job
Review this implementation plan. Evaluate:
1. Is the plan complete and addresses all requirements?
2. Are there missing edge cases?
3. Is the approach sound?

## Record Results
curl -s -X POST "http://localhost:5173/api/task/<ID>/plan-review?project=<PROJECT>" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "sonnet", "status": "approved", "comment": "<REVIEW_MARKDOWN>"}'

Status must be exactly `"approved"` or `"changes_requested"`.
```

Default mode: After review, ask user with AskUserQuestion whether to accept/reject.
Auto mode (`--auto`): Auto-accept the review agent's decision.

**`impl` → Worker Agent (opus) then TDD Tester (sonnet) — sequential**:

Step 1 - Worker Agent:
```
Use Task tool: model="opus", subagent_type="general-purpose"
```

Worker Agent prompt:
```
You are a Worker Agent implementing Kanban task #<ID>.

## Task Info
- Title: <title>
- Requirements: <description>
- Plan: <plan>
- Plan Review Comments: <plan_review_comments>

## Your Job
1. Follow the plan to implement the changes
2. Write clean, well-tested code
3. Document what you changed

## Record Results
curl -s -X PATCH "http://localhost:5173/api/task/<ID>?project=<PROJECT>" \
  -H 'Content-Type: application/json' \
  -d '{"implementation_notes": "<NOTES_MARKDOWN>", "current_agent": "worker-agent"}'

Do NOT change the status - the orchestrator handles that.
```

Step 2 - TDD Tester (runs after Worker completes):
```
Use Task tool: model="sonnet", subagent_type="general-purpose"
```

TDD Tester prompt:
```
You are a TDD Tester for Kanban task #<ID>.

## Task Info
- Title: <title>
- Requirements: <description>
- Implementation Notes: <implementation_notes>

## Your Job
1. Read the implementation notes to understand what was changed
2. Write or update test code for the new/modified code
3. Ensure test coverage for edge cases
4. Append your test notes to implementation_notes

Do NOT run tests — that's the Test Runner's job. Write test code only.

## Record Results
curl -s -X PATCH "http://localhost:5173/api/task/<ID>?project=<PROJECT>" \
  -H 'Content-Type: application/json' \
  -d '{"implementation_notes": "<UPDATED_NOTES>", "current_agent": "tdd-tester"}'

Do NOT change the status.
```

After both complete, move to impl_review:
```bash
curl -s -X PATCH "http://localhost:5173/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "impl_review", "current_agent": null}'
```

**`impl_review` → Code Review Agent (sonnet)**:

```
Use Task tool: model="sonnet", subagent_type="general-purpose"
```

Code Review Agent prompt:
```
You are a Code Review Agent for Kanban task #<ID>.

## Task Info
- Title: <title>
- Requirements: <description>
- Plan: <plan>
- Implementation Notes: <implementation_notes>

## Your Job
Review this code implementation. Evaluate:
1. Code quality: readability, duplication, naming
2. Error handling: proper try-catch, error messages
3. Type safety: TypeScript types, minimize any usage
4. Security: SQL injection, XSS, input validation
5. Performance: unnecessary queries, memory usage

## Record Results
curl -s -X POST "http://localhost:5173/api/task/<ID>/review?project=<PROJECT>" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "sonnet", "status": "approved", "comment": "<REVIEW_MARKDOWN>"}'

Status must be exactly `"approved"` or `"changes_requested"`.
```

Default mode: Ask user with AskUserQuestion whether to accept/reject.
Auto mode: Auto-accept the review agent's decision.

**`test` → Test Runner Agent**:
```
Use Task tool: model="sonnet", subagent_type="general-purpose"
```

Test Runner prompt:
```
You are a Test Runner Agent for Kanban task #<ID>.

## Task Info
- Title: <title>
- Implementation Notes: <implementation_notes>

## Your Job
1. Run lint checks
2. Run build
3. Run tests
4. Report results

## Record Results
curl -s -X POST "http://localhost:5173/api/task/<ID>/test-result?project=<PROJECT>" \
  -H 'Content-Type: application/json' \
  -d '{"tester": "test-runner", "status": "pass", "lint": "...", "build": "...", "tests": "...", "comment": "..."}'

Status must be exactly `"pass"` or `"fail"`.
```

### Step (Single Step)
`/kanban step <ID>` — Execute only the next pipeline step for a task

Same as `/kanban run` but exits after one step instead of looping.

### Review
`/kanban review <ID>`

When a task is in `impl_review` status, trigger a Code Review agent (same as impl_review step in the pipeline).

### Edit Task
`/kanban edit <ID>`

Ask the user which fields to modify, then update via API.

### Delete Task
`/kanban remove <ID>`

```bash
# Via API (if dev server running)
curl -s -X DELETE "http://localhost:5173/api/task/$ID?project=$PROJECT"

# Via sqlite3 CLI (if dev server not running)
sqlite3 ~/.claude/kanban-dbs/$PROJECT.db "DELETE FROM tasks WHERE id=$ID;"
```

### Stats
`/kanban stats`

```bash
BOARD=$(curl -s "http://localhost:5173/api/board?project=$PROJECT")
echo "$BOARD" | jq '{
  todo: (.todo | length),
  plan: (.plan | length),
  plan_review: (.plan_review | length),
  impl: (.impl | length),
  impl_review: (.impl_review | length),
  test: (.test | length),
  done: (.done | length),
  total: ((.todo + .plan + .plan_review + .impl + .impl_review + .test + .done) | length)
}'
```

## Error Handling

### Agent Failure
- 1 retry on first failure
- 2nd failure: keep current status, log error to `agent_log`, notify user

### Review Rejection Loop (Circuit Breaker)
- `plan_review_count > 3`: stop loop, ask user for guidance
- `impl_review_count > 3`: stop loop, ask user for guidance
- In `--auto` mode: circuit breaker still fires, loop stops, user intervention required

### Mid-Pipeline Crash
- Current status is preserved (no partial transitions)
- Error logged to `agent_log`
- User notified of the failure

## Agent Context Flow (Card = Communication Channel)

Each agent reads all card fields and writes to its designated field:

```
Plan Agent   → reads: description
              → writes: plan
              → moves: todo → plan_review

Review Agent → reads: description, plan
              → writes: plan_review_comments
              → moves: plan_review → impl (approved) or plan (rejected)

Worker Agent → reads: description, plan, plan_review_comments
              → writes: implementation_notes
              → (no status change)

TDD Tester   → reads: description, implementation_notes
              → writes: implementation_notes (appends)
              → moves: impl → impl_review (after both complete)

Code Review  → reads: description, plan, implementation_notes
              → writes: review_comments
              → moves: impl_review → test (approved) or impl (rejected)

Test Runner  → reads: implementation_notes
              → writes: test_results
              → moves: test → done (pass) or impl (fail)

All agents   → append to: agent_log
```

## Initial Setup

Run `/kanban-init` first to register this project. It creates `.claude/kanban.json` and ensures the central DB schema exists.

If needed manually:
```bash
sqlite3 ~/.claude/kanban-dbs/$PROJECT.db "CREATE TABLE IF NOT EXISTS tasks (...);"
```

## .gitignore

Add to `.gitignore` (the DB lives centrally, not in the project):
```bash
echo ".claude/kanban.json" >> .gitignore
echo "kanban-board/" >> .gitignore
```

## Web Board Viewer

Run `/kanban-init` to register the project. Then start the central board:

```bash
./kanban-board/start.sh
# → http://localhost:5173/?project=<YOUR_PROJECT>
```

Default port: 5173 (auto-increments if in use). All projects share one board — use the project dropdown or `?project=` URL param to filter. Features: 7-column pipeline, drag-and-drop (valid transitions only), card lifecycle modal, agent log viewer, 10s auto-refresh.
