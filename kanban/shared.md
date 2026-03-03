# Kanban Shared Context

Manages project tasks in **Neon PostgreSQL** via the kanban-board HTTP API.
All projects share a single centralized DB — the kanban-board server must be running for all operations.

## DB Path & Project Config

Read project config from `.claude/kanban.json` (created by `/kanban-init`):

```bash
CONFIG=$(cat .claude/kanban.json 2>/dev/null)
PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")
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

## API Access

All DB operations go through the kanban-board HTTP API (`http://localhost:5173`).
Start the server with `./kanban-board/start.sh` before using any kanban commands.

### API Endpoints

```bash
# Board — full (web UI, task detail views)
curl -s "http://localhost:5173/api/board?project=$PROJECT"

# Board — summary (list/stats/context — excludes large TEXT fields)
curl -s "http://localhost:5173/api/board?project=$PROJECT&summary=true"

# Read task — full
curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT"

# Read task — agent-specific fields only (always includes id, project, status)
curl -s "http://localhost:5173/api/task/$ID?project=$PROJECT&fields=title,description,plan"

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

## JSON Safety in curl

When passing user-supplied text (titles, descriptions) to curl, use `jq` or Python to build the JSON — never embed raw text in shell strings, as literal newlines and quotes break JSON:

```bash
# Safe: use jq
PAYLOAD=$(jq -n \
  --arg title "$TITLE" \
  --arg project "$PROJECT" \
  --arg description "$DESCRIPTION" \
  --argjson level 2 \
  '{title: $title, project: $project, priority: "medium", level: $level, description: $description}')
curl -s -X POST http://localhost:5173/api/task \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD"
```

Or use Python `json.dumps()` to serialize the body safely.

## Error Handling

> **CRITICAL: If the API call fails, NEVER fall back to SQLite or any direct DB access.**
> The kanban DB is Neon PostgreSQL — there is no local SQLite file. Fix the API call and retry.

- **Server not running**: Run `./kanban-board/start.sh` first and retry
- **API error**: Debug the request (check JSON validity, PROJECT variable) — do NOT bypass the API
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
| `Refiner` | `title`, `description` | `description` (rewrite) | stays `todo` |
| `Planner` | `description` | `plan`, `decision_log`, `done_when` | `plan_review` |
| `Critic` | `description`, `plan`, `decision_log`, `done_when` | `plan_review_comments` | `impl` or `plan` |
| `Builder` | `description`, `plan`, `done_when`, `plan_review_comments` | `implementation_notes` | (none) |
| `Shield` | `description`, `implementation_notes` | `implementation_notes` (append) | `impl_review` |
| `Inspector` | `description`, `plan`, `done_when`, `implementation_notes` | `review_comments` | `test` or `impl` |
| `Ranger` | `title`, `implementation_notes` | `test_results` | `done` or `impl` |
| All agents | — | append signed entry to `agent_log` | — |
