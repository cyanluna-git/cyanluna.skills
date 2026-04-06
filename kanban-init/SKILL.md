---
name: kanban-init
description: "Register and initialize the current project in PostgreSQL kanban. Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init."
license: MIT
---

Registers the current project in **PostgreSQL** (shared central DB) and creates a local config so `/kanban` knows which project to use.
No per-project DB file is created — the central PostgreSQL server handles storage for all projects automatically.

## Usage

```
/kanban-init                                      — project name = basename of current directory, board = https://cyanlunakanban.vercel.app
/kanban-init my-project-name                      — explicit project name, board = https://cyanlunakanban.vercel.app
/kanban-init my-project-name https://board.example.com
                                                 — explicit project name + remote board URL
/kanban-init https://board.example.com           — current directory name + remote board URL
```

If a URL argument is present, treat it as `base_url`. Strip any leading dashes from the project token: `kanban-init -unahouse.finance` → project `unahouse.finance`.

## Procedure

### 1. Determine project name and board URL

```bash
# Split raw args
set -- $ARG
ARG1="${1:-}"
ARG2="${2:-}"

# Accept either:
#   /kanban-init my-project
#   /kanban-init my-project https://board.example.com
#   /kanban-init https://board.example.com
if printf '%s' "$ARG1" | grep -Eq '^https?://'; then
  PROJECT=$(basename "$(pwd)" | sed 's/\.db$//')
  BASE_URL="$ARG1"
else
  PROJECT=$(printf '%s' "$ARG1" | sed 's/^-*//' | sed 's/\.db$//')
  if [ -z "$PROJECT" ]; then
    PROJECT=$(basename "$(pwd)" | sed 's/\.db$//')
  fi
  BASE_URL="${ARG2:-https://cyanlunakanban.vercel.app}"
fi

```

**Always strip `.db` suffix** — old configs stored the DB filename as the project name (e.g. `cpet.db`), which would conflict without this fix.

### 2. Write local project config

Create both config files in the **current project root**:
- `.claude/kanban.json`
- `.codex/kanban.json`

```json
{
  "project": "<PROJECT_NAME>"
}
```

**kanban.json stores ONLY the project name.** Auth credentials (`base_url`, `auth_token`) are stored separately in `~/.claude/kanban-auth`.

Use the Write tool to create both files with the same content.

### 2b. Set up global auth (if not exists)

Check if `~/.claude/kanban-auth` exists. If not, and a `BASE_URL` was provided:

```bash
KANBAN_AUTH_FILE="$HOME/.claude/kanban-auth"
if [ ! -f "$KANBAN_AUTH_FILE" ]; then
  # Write global auth file
  cat > "$KANBAN_AUTH_FILE" << EOF
KANBAN_BASE_URL=$BASE_URL
KANBAN_AUTH_TOKEN=${KANBAN_AUTH_TOKEN:-}
EOF
fi
```

If `~/.claude/kanban-auth` already exists, show its current `KANBAN_BASE_URL` and confirm it matches. Do NOT overwrite without asking.

### 2c. Auto-register project in projects table

After writing the config, upsert the current project to the projects table via POST /api/projects.
Infer project metadata from the local environment:

```bash
# Infer category from path
PARENT_DIR=$(basename "$(dirname "$(pwd)")")
if [ "$PARENT_DIR" = "edwards" ]; then
  CATEGORY="edwards"
elif echo "$PROJECT" | grep -qE 'skills|kanban'; then
  CATEGORY="skills"
elif echo "$PROJECT" | grep -qE 'tools|assist|gmail|jira'; then
  CATEGORY="tools"
elif [ "$PROJECT" = "community.skills" ]; then
  CATEGORY="community"
else
  CATEGORY="personal"
fi

# Infer purpose from CLAUDE.md (first non-heading, non-empty line)
PURPOSE=""
if [ -f "CLAUDE.md" ]; then
  PURPOSE=$(grep -v '^#' CLAUDE.md | grep -v '^---' | grep -v '^\s*$' | head -1 | cut -c1-300)
fi

# Infer stack from CLAUDE.md
STACK=""
if [ -f "CLAUDE.md" ]; then
  STACK=$(grep -iE 'stack|tech|typescript|javascript|python|react|vue|next|node|vite' CLAUDE.md | head -1 | cut -c1-200)
fi

# Infer repo_url from git remote
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")

# Upsert project
PROJ_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
  'id': '$PROJECT',
  'name': '$PROJECT',
  'purpose': '''$PURPOSE''' if '''$PURPOSE''' else None,
  'stack': '''$STACK''' if '''$STACK''' else None,
  'category': '$CATEGORY',
  'repo_url': '$REPO_URL' if '$REPO_URL' else None,
}))
")
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/projects" \
  -H 'Content-Type: application/json' \
  -d "$PROJ_PAYLOAD" > /dev/null 2>&1 || true
```

This is best-effort — if the API call fails (e.g., server not running), init still succeeds.

### 3. Output confirmation

Output:
```
✅ Project '<PROJECT_NAME>' registered in kanban.

  Config:  .codex/kanban.json, .claude/kanban.json
  DB:      PostgreSQL (shared central DB)
  Board:   <BASE_URL>/?project=<PROJECT_NAME>
  Auth:    ~/.claude/kanban-auth (global, shared across all projects)

Add tasks with /kanban add <title>
```

## Notes

### Existing config detection

If either `.codex/kanban.json` or `.claude/kanban.json` already exists:
1. Read the `project` field and **strip `.db` suffix** (old format stored DB filename as project name)
2. If the config contains `base_url` or `auth_token`, migrate them to `~/.claude/kanban-auth` and remove from kanban.json
3. If the cleaned name differs from what's stored (e.g. `cpet.db` → `cpet`), show the migration clearly
4. Ask the user whether to overwrite or keep as-is:

```
.codex/kanban.json or .claude/kanban.json already exists:
  Current project: "cpet.db"  →  will use "cpet" (stripped .db suffix)
  Current board: "https://board.example.com"

Options:
1. Overwrite — update config
2. Keep as-is — leave existing config unchanged
```

- `/kanban-init` should default to `https://cyanlunakanban.vercel.app` unless the user explicitly provides another deployment URL.
- `node_modules/` in a local `kanban-board/` is not required for normal kanban usage.
- Auth credentials are stored globally in `~/.claude/kanban-auth`, NOT in per-project kanban.json. This prevents token duplication across repos and keeps secrets out of git.
- For remote private boards, set `KANBAN_AUTH_TOKEN` in the shell before running `/kanban-init`, or edit `~/.claude/kanban-auth` directly.
