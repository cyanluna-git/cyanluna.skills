---
name: kanban-init
description: "Register and initialize the current project in Neon PostgreSQL kanban. Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init."
license: MIT
---

Registers the current project in **Neon PostgreSQL** (shared central DB) and creates a local config so `/kanban` knows which project to use.
No per-project DB file is created — Neon handles storage for all projects automatically.

## Usage

```
/kanban-init                  — project name = basename of current directory
/kanban-init my-project-name  — explicit project name
```

The argument after `kanban-init` (if any) is the project name. Strip any leading dashes: `kanban-init -unahouse.finance` → project `unahouse.finance`.

## Procedure

### 1. Determine project name

```bash
# If argument provided, strip leading dashes and .db suffix:
PROJECT=$(echo "$ARG" | sed 's/^-*//' | sed 's/\.db$//')

# Otherwise, use basename of current directory (also strip .db if present):
PROJECT=$(basename "$(pwd)" | sed 's/\.db$//')
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

Use the Write tool to create both files with the same content.

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
  Board:   http://localhost:5173/?project=<PROJECT_NAME>
  Start:   ./kanban-board/start.sh

Add tasks with /kanban add <title>
```

## Notes

### Existing config detection

If either `.codex/kanban.json` or `.claude/kanban.json` already exists:
1. Read the `project` field and **strip `.db` suffix** (old format stored DB filename as project name)
2. If the cleaned name differs from what's stored (e.g. `cpet.db` → `cpet`), show the migration clearly
3. Ask the user whether to overwrite or keep as-is:

```
.codex/kanban.json or .claude/kanban.json already exists:
  Current project: "cpet.db"  →  will use "cpet" (stripped .db suffix)

Options:
1. Overwrite — update config
2. Keep as-is — leave existing config unchanged
```

- The central board (`~/.claude/kanban-board/`) must be installed. If `~/.claude/kanban-board/package.json` doesn't exist, warn the user.
- The central board should exist in either `~/.codex/kanban-board/` or `~/.claude/kanban-board/`. If neither has `package.json`, warn the user.
- `node_modules/` in the local `kanban-board/` is not created (no `pnpm install` needed — the central board handles its own deps).
- The kanban-board server must be running (`./kanban-board/start.sh`) before using `/kanban` commands.
