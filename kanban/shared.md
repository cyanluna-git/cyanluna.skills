# Kanban Shared Context

Manages project tasks in **Neon PostgreSQL** via the kanban-board HTTP API.
All projects share a single centralized DB — the kanban-board server must be running for all operations.

## DB Path & Project Config

Read project config from `.codex/kanban.json` or `.claude/kanban.json` (created by `/kanban-init`):

```bash
CONFIG=$(cat .codex/kanban.json 2>/dev/null || cat .claude/kanban.json 2>/dev/null)
PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")
BASE_URL=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('base_url') or 'http://localhost:5173')" 2>/dev/null || echo "http://localhost:5173")
AUTH_TOKEN=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('auth_token') or '')" 2>/dev/null || true)
AUTH_HEADER=()
if [ -n "$AUTH_TOKEN" ]; then
  AUTH_HEADER=(-H "X-Kanban-Auth: $AUTH_TOKEN")
fi
```

If neither config file exists, prompt user to run `/kanban-init`, or fall back to:

```bash
PROJECT=$(basename "$(pwd)")
BASE_URL="http://localhost:5173"
AUTH_TOKEN=""
AUTH_HEADER=()
```

Legacy configs containing only `{ "project": "..." }` remain valid. In that case, treat `base_url` as `http://localhost:5173` and `auth_token` as empty.

Quick debug check before a failing request:

```bash
echo "KANBAN_PROJECT=$PROJECT"
echo "KANBAN_BASE_URL=$BASE_URL"
echo "KANBAN_AUTH_TOKEN=$([ -n "$AUTH_TOKEN" ] && echo configured || echo empty)"
```

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

| Column | Status | Agent | Model Key |
|--------|--------|-------|-------|
| Req | `todo` | User | - |
| Plan | `plan` | Plan Agent | `planner` |
| Review Plan | `plan_review` | Review Agent | `critic` |
| Impl | `impl` | Worker → TDD Tester (sequential) | `builder` → `shield` |
| Review Impl | `impl_review` | Code Review Agent | `inspector` |
| Test | `test` | Test Runner | `ranger` |
| Done | `done` | - | - |

Model keys are resolved to real provider models through `models.json`.

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

All DB operations go through the kanban-board HTTP API (`$BASE_URL`).
Start the server with `./kanban-board/start.sh` before using any kanban commands when `BASE_URL` points to localhost.

### API Endpoints

```bash
# Board — full (web UI, task detail views)
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT"

# Board — summary (list/stats/context — excludes large TEXT fields)
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true"

# Read task — full
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT"

# Read task — agent-specific fields only (always includes id, project, status)
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT&fields=title,description,plan"

# Update task fields / status
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"plan": "...", "status": "plan_review"}'

# Create task
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task" \
  -H 'Content-Type: application/json' \
  -d "{\"title\": \"...\", \"project\": \"$PROJECT\", \"priority\": \"medium\", \"level\": 3, \"description\": \"...\"}"

# Plan review result
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task/$ID/plan-review?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "Critic", "model": "<MODEL_CRITIC>", "status": "approved", "comment": "..."}'

# Impl review result
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task/$ID/review?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"reviewer": "Inspector", "model": "<MODEL_INSPECTOR>", "status": "approved", "comment": "..."}'

# Test result
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task/$ID/test-result?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"tester": "test-runner", "status": "pass", "lint": "...", "build": "...", "tests": "...", "comment": "..."}'

# Add note
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task/$ID/note?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"content": "Commit: abc1234"}'

# Reorder
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID/reorder?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "plan", "afterId": null, "beforeId": null}'

# Delete
curl -s "${AUTH_HEADER[@]}" -X DELETE "$BASE_URL/api/task/$ID?project=$PROJECT"
```

If `AUTH_TOKEN` is set, keep using the shared `AUTH_HEADER` array so every request can target the same protected board deployment without repeating conditional header logic.

> For full schema, column descriptions, and JSON field formats, read `schema.md`.

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
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/task" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD"
```

Or use Python `json.dumps()` to serialize the body safely.

## Error Handling

> **CRITICAL: If the API call fails, NEVER fall back to SQLite or any direct DB access.**
> The kanban DB is Neon PostgreSQL — there is no local SQLite file. Fix the API call and retry.

- **Server not running**: Run `./kanban-board/start.sh` first and retry when using localhost
- **API error**: Debug the request (check JSON validity, `PROJECT`, `BASE_URL`, and whether `AUTH_TOKEN` is configured) — do NOT bypass the API
- **Agent failure**: 1 retry on first failure; 2nd failure → keep status, log to `agent_log`, notify user
- **Plan review loop**: `plan_review_count > 3` → circuit breaker, ask user
- **Impl review loop**: `impl_review_count > 3` → circuit breaker, ask user
- **Mid-pipeline crash**: preserve current status, log to `agent_log`, notify user
- In `--auto` mode: circuit breaker still fires, requires user intervention

## Agent Context Flow (Card = Work Record)

Each agent **signs their output** with a header: `> **Nickname** \`model\` · timestamp`
The `agent_log` accumulates the full chronological history of all agents who touched the task.

The `model` value should be the resolved provider model from `models.json` (not a hardcoded provider name in the template).

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
