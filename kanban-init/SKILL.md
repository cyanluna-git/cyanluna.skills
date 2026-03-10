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

# Optional shared token for private remote boards
AUTH_TOKEN="${KANBAN_AUTH_TOKEN:-}"
```

**Always strip `.db` suffix** — old configs stored the DB filename as the project name (e.g. `cpet.db`), which would conflict without this fix.
If no board URL is provided, default to `http://localhost:5173`.

### 2. Write local project config

Create both config files in the **current project root**:
- `.claude/kanban.json`
- `.codex/kanban.json`

```json
{
  "project": "<PROJECT_NAME>",
  "base_url": "<BASE_URL>",
  "auth_token": "<OPTIONAL_AUTH_TOKEN>"
}
```

`auth_token` is optional. Omit it when not provided.

Use the Write tool to create both files with the same content. Existing configs that only contain `{ "project": "..." }` remain valid and should still be treated as:

```json
{
  "project": "<PROJECT_NAME>",
  "base_url": "http://localhost:5173"
}
```

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
  Auth:    configured from KANBAN_AUTH_TOKEN (optional)
  Start:   ./kanban-board/start.sh

Add tasks with /kanban add <title>
```

## Notes

### Existing config detection

If either `.codex/kanban.json` or `.claude/kanban.json` already exists:
1. Read the `project` field and **strip `.db` suffix** (old format stored DB filename as project name)
2. Preserve existing `base_url` and `auth_token` unless the user explicitly overwrites them
3. If the cleaned name differs from what's stored (e.g. `cpet.db` → `cpet`), show the migration clearly
3. Ask the user whether to overwrite or keep as-is:

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
- For remote private boards, prefer setting `KANBAN_AUTH_TOKEN` in the shell before running `/kanban-init` so the token is not hardcoded into the skill prompt text.
