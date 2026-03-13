---
name: kanban-init
description: "Register and initialize the current project in Neon PostgreSQL kanban. Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init."
license: MIT
---

Registers the current project in **Neon PostgreSQL** (shared central DB) and creates a local config so `/kanban` knows which project to use.
No per-project DB file is created — Neon handles storage for all projects automatically.

## Usage

```
/kanban-init                                      — project name = basename of current directory, board = localhost
/kanban-init my-project-name                      — explicit project name, board = localhost
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
  BASE_URL="${ARG2:-http://localhost:5173}"
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

### 3. Create `kanban-board/start.sh`

```bash
mkdir -p kanban-board
```

Write `kanban-board/start.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
if [ -d "$HOME/.codex/kanban-board" ]; then
  pnpm --dir "$HOME/.codex/kanban-board" dev
elif [ -d "$HOME/.claude/kanban-board" ]; then
  pnpm --dir "$HOME/.claude/kanban-board" dev
else
  echo "kanban-board not found in ~/.codex/kanban-board or ~/.claude/kanban-board" >&2
  exit 1
fi
```

Make executable:
```bash
chmod +x kanban-board/start.sh
```

### 4. Output confirmation

Output:
```
✅ Project '<PROJECT_NAME>' registered in kanban.

  Config:  .codex/kanban.json, .claude/kanban.json
  DB:      Neon PostgreSQL (shared central DB)
  Board:   <BASE_URL>/?project=<PROJECT_NAME>
  Auth:    ~/.claude/kanban-auth (global, shared across all projects)
  Start:   ./kanban-board/start.sh

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

- The central board (`~/.claude/kanban-board/`) must be installed. If `~/.claude/kanban-board/package.json` doesn't exist, warn the user.
- The central board should exist in either `~/.codex/kanban-board/` or `~/.claude/kanban-board/`. If neither has `package.json`, warn the user.
- `node_modules/` in the local `kanban-board/` is not created (no `pnpm install` needed — the central board handles its own deps).
- The kanban-board server must be running (`./kanban-board/start.sh`) before using `/kanban` commands when `base_url` points at localhost.
- Auth credentials are stored globally in `~/.claude/kanban-auth`, NOT in per-project kanban.json. This prevents token duplication across repos and keeps secrets out of git.
- For remote private boards, set `KANBAN_AUTH_TOKEN` in the shell before running `/kanban-init`, or edit `~/.claude/kanban-auth` directly.
