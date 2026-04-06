# Kanban Shared Context

Manages project tasks in **PostgreSQL** via the kanban-board HTTP API.
All projects share a single centralized DB on the deployed Vercel board.

## DB Path & Project Config

Read project config from `.codex/kanban.json` or `.claude/kanban.json` (created by `/kanban-init`).
Auth credentials are loaded from the global `~/.claude/kanban-auth` file (shared across all projects).

```bash
# 1. Project config (project name only)
CONFIG=$(cat .codex/kanban.json 2>/dev/null || cat .claude/kanban.json 2>/dev/null)
PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")

# 2. Auth from ~/.claude/kanban-auth (global, shared across projects)
KANBAN_AUTH_FILE="$HOME/.claude/kanban-auth"
if [ -f "$KANBAN_AUTH_FILE" ]; then
  BASE_URL=$(grep '^KANBAN_BASE_URL=' "$KANBAN_AUTH_FILE" | cut -d= -f2-)
  AUTH_TOKEN=$(grep '^KANBAN_AUTH_TOKEN=' "$KANBAN_AUTH_FILE" | cut -d= -f2-)
fi

# 3. Fallback: legacy kanban.json with embedded auth (backward compat)
if [ -z "${BASE_URL:-}" ]; then
  BASE_URL=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('base_url') or '')" 2>/dev/null || true)
fi
if [ -z "${AUTH_TOKEN:-}" ]; then
  AUTH_TOKEN=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('auth_token') or '')" 2>/dev/null || true)
fi

# 4. Defaults
BASE_URL="${BASE_URL:-https://cyanlunakanban.vercel.app}"
AUTH_HEADER=()
if [ -n "$AUTH_TOKEN" ]; then
  AUTH_HEADER=(-H "X-Kanban-Auth: $AUTH_TOKEN")
fi
```

If neither config file exists, prompt user to run `/kanban-init`, or fall back to:

```bash
PROJECT=$(basename "$(pwd)")
BASE_URL="https://cyanlunakanban.vercel.app"
AUTH_TOKEN=""
AUTH_HEADER=()
```

**Auth resolution priority:** `~/.claude/kanban-auth` > kanban.json (legacy) > defaults.
`kanban.json` should only contain `{ "project": "..." }`. The `auth_token` and `base_url` fields in kanban.json are supported for backward compatibility but deprecated.

Quick debug check before a failing request:

```bash
echo "KANBAN_PROJECT=$PROJECT"
echo "KANBAN_BASE_URL=$BASE_URL"
echo "KANBAN_AUTH_TOKEN=$([ -n "$AUTH_TOKEN" ] && echo configured || echo empty)"
echo "KANBAN_AUTH_SOURCE=$([ -f "$HOME/.claude/kanban-auth" ] && echo kanban-auth || echo kanban.json)"
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

### Move Protocol (이동 전 필수)

카드를 이동하기 전 반드시 이 순서를 따른다.

**Step 1 — 현재 상태 확인**

```bash
TASK=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$ID?project=$PROJECT&fields=status,level")
STATUS=$(echo "$TASK" | jq -r '.status')
LEVEL=$(echo "$TASK" | jq -r '.level')
```

**Step 2 — Level × Status 매트릭스로 다음 상태 결정**

| 현재 Status  | L1 Quick | L2 Standard       | L3 Full                |
|-------------|----------|-------------------|------------------------|
| `todo`      | `impl`   | `plan`            | `plan`                 |
| `plan`      | —        | `impl`            | `plan_review` / `todo` |
| `plan_review` | —      | —                 | `impl` / `plan`        |
| `impl`      | `done`   | `impl_review`     | `impl_review`          |
| `impl_review` | —      | `done` / `impl`   | `test` / `impl`        |
| `test`      | —        | —                 | `done` / `impl`        |
| `done`      | (terminal) | (terminal)      | (terminal)             |

**Step 3 — 이동 실행**

```bash
RESPONSE=$(curl -s -w "\n%{http_code}" "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d "{\"status\": \"$NEXT_STATUS\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -1)
```

**400 발생 시 자기 교정 (1회)**

```bash
if [ "$HTTP_CODE" = "400" ]; then
  # API 응답의 allowed 배열에서 유효한 목적지를 읽어 재시도
  ALLOWED=$(echo "$BODY" | jq -r '.allowed[0]')
  if [ -n "$ALLOWED" ] && [ "$ALLOWED" != "null" ]; then
    curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID?project=$PROJECT" \
      -H 'Content-Type: application/json' \
      -d "{\"status\": \"$ALLOWED\"}"
  else
    # allowed도 없으면: 상태 유지, agent_log에 기록, 사용자에게 알림
    echo "ERROR: cannot move task $ID from $STATUS — API returned: $BODY"
  fi
fi
```

2회 연속 실패 시: 상태 유지, `agent_log`에 실패 내역 기록, 사용자에게 알림.

## API Access

All DB operations go through the deployed kanban-board HTTP API (`$BASE_URL`).
Do not bypass it with local DB access.

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

### Projects API Endpoints

```bash
# List all projects with links
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects"

# Get single project with task counts and links
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects/$PROJECT"

# Create/upsert project
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/projects" \
  -H 'Content-Type: application/json' \
  -d '{"id": "my-project", "name": "My Project", "purpose": "...", "stack": "...", "category": "personal"}'

# Update project fields (purpose, stack, brief, status, category, repo_url)
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/projects/$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"brief": "Current state + direction + recent decisions"}'

# Delete project
curl -s "${AUTH_HEADER[@]}" -X DELETE "$BASE_URL/api/projects/$PROJECT"

# List project links
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects/$PROJECT/links"

# Create project link
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/projects/$PROJECT/links" \
  -H 'Content-Type: application/json' \
  -d '{"target_id": "other-project", "relation": "depends_on"}'

# Delete project link
curl -s "${AUTH_HEADER[@]}" -X DELETE "$BASE_URL/api/projects/$PROJECT/links" \
  -H 'Content-Type: application/json' \
  -d '{"target_id": "other-project", "relation": "depends_on"}'
```

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
> The kanban DB is PostgreSQL — there is no local SQLite file. Fix the API call and retry.

- **Board unreachable**: Check `BASE_URL`, network reachability to `https://cyanlunakanban.vercel.app`, and whether `AUTH_TOKEN` is configured
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

## Task Dependencies

### Convention

To declare dependencies, write `Depends on: #ID` (or `Depends on: #ID1, #ID2`) on the **first non-blank line** of the task description.

Example:
```
Depends on: #2100, #2150
Add task dependency context injection to kanban-run...
```

### Parsing

Regex: `Depends on:\s*(#\d+(?:,\s*#\d+)*)`  (case-insensitive)

Extract each `#ID` number. If the line is absent or no IDs match, dependency list is empty.

### Fetching Dependency Data

For each dependency ID, fetch:
```bash
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/task/$DEP_ID?project=$PROJECT&fields=title,status,decision_log,implementation_notes"
```

All fields are fetched once and cached. Per-agent filtering happens at context assembly time, not at fetch time.

### Per-Agent Injection Rules

| Agent | Fields Injected | Truncation |
|-------|----------------|------------|
| `Planner` | `decision_log` + `implementation_notes` | 500 chars each |
| `Builder` | `implementation_notes` | 500 chars |
| `Inspector` | `decision_log` | 300 chars |

Truncation format: first N chars + `...[truncated]` suffix when the field exceeds the limit.

### Context Format (per dependency)

```
### #<DEP_ID>: <title> [<status>]
[IN PROGRESS] ← only if status != done

**Decision Log:**
<decision_log truncated per agent rule>

**Implementation Notes:**
<implementation_notes truncated per agent rule>
```

Fields not applicable to the current agent are omitted entirely.

### Error Handling

- **404 response**: warn in orchestrator log, skip that dependency, continue pipeline
- **Dep task in progress** (status != `done`): prepend `[IN PROGRESS]` warning to that dep's context block
- **Circular dependency**: if current task ID appears in a dependency's `Depends on:` line, emit error and abort the pipeline
- **No dependencies**: `<dependencies_context>` resolves to empty string; no behavioral change

### Review Feedback Injection

These placeholders carry feedback from previous review cycles (re-runs):

| Placeholder | Source Field | When Populated |
|-------------|-------------|----------------|
| `<critic_feedback>` | `plan_review_comments` | Planner re-run: last entry's `comment` from the JSON array |
| `<inspector_feedback>` | `review_comments` | Builder re-run: last entry's `comment` from the JSON array |

If the source field is empty or null (first run), the placeholder resolves to empty string.
