---
name: kanban
description: Manage project tasks in Neon PostgreSQL via kanban-board HTTP API. Supports task CRUD (add, edit, move, remove), board viewing, session context persistence, and statistics. For pipeline orchestration use /kanban-run, for requirements refinement use /kanban-refine. Run /kanban-init first to register the project.
license: MIT
---

> Shared context: read `shared.md` for DB path, pipeline levels, status transitions, API endpoints, error handling, and agent context flow.

## Commands

### `/kanban` or `/kanban list` — View Board

```bash
BOARD=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true")
```

Output: markdown table with ID, Status, Priority, Title.

### `/kanban context` — Session Handoff

**Run first when starting a new session.** Fetch board and output pipeline state:
Implementing / Plan Review / Impl Review / Testing / Recently Done / Next Todo.

```bash
BOARD=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true")
```

### `/kanban add <title>` — Add Task

1. Ask user for priority, level (L1/L2/L3), description, tags (use AskUserQuestion)
2. Build JSON safely with `jq` (see shared.md → JSON Safety), POST to API, output confirmation with new task ID

### `/kanban move <ID> <status>` — Move Task

```bash
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/task/$ID?project=$PROJECT" \
  -H 'Content-Type: application/json' \
  -d "{\"status\": \"$STATUS\"}"
```

The API enforces valid transitions. Invalid moves return 400 with allowed transitions.

### `/kanban edit <ID>` — Edit Task

Ask user which fields to modify, then PATCH via API.

### `/kanban remove <ID>` — Delete Task

```bash
curl -s "${AUTH_HEADER[@]}" -X DELETE "$BASE_URL/api/task/$ID?project=$PROJECT"
```

### `/kanban stats` — Statistics

```bash
BOARD=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$PROJECT&summary=true")
echo "$BOARD" | jq '{
  todo: (.todo | length), plan: (.plan | length),
  plan_review: (.plan_review | length), impl: (.impl | length),
  impl_review: (.impl_review | length), test: (.test | length),
  done: (.done | length),
  total: ((.todo + .plan + .plan_review + .impl + .impl_review + .test + .done) | length)
}'
```

### `/kanban project` — Current Project Context (AI Context Docking)

Fetch the current project's context from the projects table. Use this at the start of a session to load project purpose, stack, brief, relationships, and task counts in one call.

```bash
PROJECT_DATA=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects/$PROJECT")
```

Output: formatted project context including:
- **Purpose** (WHY this project exists)
- **Stack** (technologies used)
- **Brief** (compressed current state + direction + recent decisions)
- **Category** and status
- **Task counts** by status
- **Links** to related projects

If the project is not registered, suggest running `/kanban-init` to register it.

### `/kanban project all` — Full Project Map

Fetch all projects grouped by category. Useful for understanding the full project landscape.

```bash
ALL_PROJECTS=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects")
```

Output: projects grouped by category (edwards, personal, tools, skills, community) with names and purposes.

### `/kanban project brief` — View/Update Project Brief

The **brief** is a compressed context summary (200–500 chars) that agents consume at low token cost.

**View current brief:**
```bash
curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects/$PROJECT" | jq -r '.brief // "No brief set"'
```

**Set brief directly:**
```bash
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/projects/$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"brief": "..."}'
```

**AI-assisted update (`/kanban project brief update`):**
1. Fetch current project info + recent done tasks (`GET /api/board?project=$PROJECT&summary=true`)
2. Analyze: current state, recent completions, active direction
3. Draft a concise brief (200–500 chars) covering: what exists now, where we're heading, recent key decisions
4. Present to user for confirmation → PATCH to save

### `/kanban project update <field> <value>` — Edit Project Metadata

Update any project field via PATCH:

```bash
# Update purpose
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/projects/$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"purpose": "new purpose"}'

# Archive project
curl -s "${AUTH_HEADER[@]}" -X PATCH "$BASE_URL/api/projects/$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"status": "archived"}'
```

Supported fields: `name`, `purpose`, `stack`, `brief`, `status`, `category`, `repo_url`.

### `/kanban project link` — Manage Project Relationships

```bash
# Add relationship
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/projects/$PROJECT/links" \
  -H 'Content-Type: application/json' \
  -d '{"target_id": "other-project", "relation": "depends_on"}'

# Remove relationship
curl -s "${AUTH_HEADER[@]}" -X DELETE "$BASE_URL/api/projects/$PROJECT/links" \
  -H 'Content-Type: application/json' \
  -d '{"target_id": "other-project", "relation": "depends_on"}'
```

Relations: `extends`, `serves`, `depends_on`, `shares_data`.

## Setup & Web Board

Run `/kanban-init` first to register this project.

Add to `.gitignore`:
```
.codex/kanban.json
.claude/kanban.json
kanban-board/
```

Start web board locally: `./kanban-board/start.sh` → `http://localhost:5173/?project=<PROJECT>`
Remote boards work the same way via the configured `base_url`.
Features: 7-column pipeline, drag-and-drop (valid transitions only), card lifecycle modal, agent log viewer, 10s auto-refresh.
