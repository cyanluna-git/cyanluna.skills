---
name: kanban-init
description: "Register and initialize the current project in its own kanban DB (~/.claude/kanban-dbs/{project}.db). Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init."
license: MIT
---

Registers the current project in a **per-project** `~/.claude/kanban-dbs/{project}.db` SQLite database and creates a local config so `/kanban` knows which project to use.

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

**Always strip `.db` suffix** — old configs stored the DB filename as the project name (e.g. `cpet.db`), which would create `cpet.db.db` without this fix.

### 2. Ensure per-project DB schema exists

Read the canonical schema from `~/.claude/skills/kanban/schema.md` (the `CREATE TABLE` block), then run:

```bash
mkdir -p ~/.claude/kanban-dbs
sqlite3 ~/.claude/kanban-dbs/${PROJECT}.db "<CREATE_TABLE_SQL_FROM_SCHEMA_MD>"

# OneDrive sync safety: use DELETE journal mode instead of WAL
# WAL mode creates -wal/-shm sidecar files that can desync during cloud sync
sqlite3 ~/.claude/kanban-dbs/${PROJECT}.db "PRAGMA journal_mode=DELETE;"
```

> **Schema source of truth**: `~/.claude/skills/kanban/schema.md` — always read from there.
> Do NOT hardcode the SQL here; the schema file is the single source of truth.

### 3. Write local project config

Create `.claude/kanban.json` in the **current project root**:

```json
{
  "project": "<PROJECT_NAME>"
}
```

Use the Write tool to create this file at `.claude/kanban.json`.

### 4. Create `kanban-board/start.sh`

```bash
mkdir -p kanban-board
```

Write `kanban-board/start.sh`:
```bash
#!/usr/bin/env bash
pnpm --dir ~/.claude/kanban-board dev
```

Make executable:
```bash
chmod +x kanban-board/start.sh
```

### 5. Output confirmation

First, detect whether `~/.claude/kanban-dbs` is a symlink:
```bash
DBLINK=$(readlink ~/.claude/kanban-dbs 2>/dev/null)
```

Then output:
```
✅ Project '<PROJECT_NAME>' registered in kanban.

  Config:  .claude/kanban.json
  DB:      ~/.claude/kanban-dbs/<PROJECT_NAME>.db
           → <DBLINK>/<PROJECT_NAME>.db  (OneDrive ✅)   ← if DBLINK is set
           ⚠️  Not a symlink — run OneDrive setup below for cross-PC sync  ← if DBLINK is empty
  Board:   http://localhost:5173/?project=<PROJECT_NAME>
  Start:   ./kanban-board/start.sh

Add tasks with /kanban add <title>
```

## Notes

### Existing config detection

If `.claude/kanban.json` already exists:
1. Read the `project` field and **strip `.db` suffix** (old format stored DB filename as project name)
2. If the cleaned name differs from what's stored (e.g. `cpet.db` → `cpet`), show the migration clearly
3. Ask the user whether to overwrite or keep as-is:

```
.claude/kanban.json already exists:
  Current project: "cpet.db"  →  will use "cpet" (stripped .db suffix)
  New DB path: ~/.claude/kanban-dbs/cpet.db

Options:
1. Overwrite — update config to new per-project format
2. Keep as-is — leave existing config unchanged
```

- The central board (`~/.claude/kanban-board/`) must be installed. If `~/.claude/kanban-board/package.json` doesn't exist, warn the user.
- `node_modules/` in the local `kanban-board/` is not created (no `pnpm install` needed — the central board handles its own deps).

## OneDrive Cross-PC Sync

For cross-PC sync via OneDrive symlink (macOS + WSL), read:
`~/.claude/skills/kanban-init/onedrive-setup.md`
