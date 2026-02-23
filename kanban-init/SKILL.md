---
name: kanban-init
description: Register and initialize the current project in its own kanban DB (~/.claude/kanban-dbs/{project}.db). Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init.
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

```bash
mkdir -p ~/.claude/kanban-dbs
sqlite3 ~/.claude/kanban-dbs/${PROJECT}.db "
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
"
# OneDrive 동기화 안전성을 위해 WAL 모드 대신 DELETE 저널 모드 사용
# WAL 모드는 -wal/-shm 사이드카 파일을 생성해 클라우드 동기화 시 파일 desync 위험이 있음
sqlite3 ~/.claude/kanban-dbs/${PROJECT}.db "PRAGMA journal_mode=DELETE;"
```

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

## OneDrive Sync Setup — symlink (macOS + WSL)

Symlink each machine's local OneDrive folder to `~/.claude/kanban-dbs`.
One-time setup per machine, no extra tools required.

```
macOS  ~/.claude/kanban-dbs → ~/Library/CloudStorage/OneDrive-Personal/dev/ai-kanban/dbs/
WSL    ~/.claude/kanban-dbs → /mnt/c/Users/{winuser}/OneDrive/dev/ai-kanban/dbs/
                               ↑ different physical paths, same OneDrive folder ✅
```

---

### macOS (first time — first machine only)

```bash
ONEDRIVE="$HOME/Library/CloudStorage/OneDrive-Personal"
# If the folder name differs: ls ~/Library/CloudStorage/ | grep -i onedrive

# Create folders in OneDrive
mkdir -p "$ONEDRIVE/dev/ai-kanban/dbs"
mkdir -p "$ONEDRIVE/dev/ai-kanban/images"

# Move existing local DBs → OneDrive
cp ~/.claude/kanban-dbs/* "$ONEDRIVE/dev/ai-kanban/dbs/" 2>/dev/null || true

# Remove local folder and create symlinks
rm -rf ~/.claude/kanban-dbs ~/.claude/kanban-images
ln -s "$ONEDRIVE/dev/ai-kanban/dbs"    ~/.claude/kanban-dbs
ln -s "$ONEDRIVE/dev/ai-kanban/images" ~/.claude/kanban-images

ls ~/.claude/kanban-dbs/   # DB files should appear
```

---

### WSL (second machine — after OneDrive has synced)

```bash
# Auto-detect Windows username
WINUSER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r\n')

# Check OneDrive folder name (may be "OneDrive", "OneDrive - Personal", etc.)
ls "/mnt/c/Users/$WINUSER/" | grep -i onedrive

# Create symlinks (adjust folder name if needed)
ONEDRIVE="/mnt/c/Users/$WINUSER/OneDrive"
mkdir -p ~/.claude
ln -s "$ONEDRIVE/dev/ai-kanban/dbs"    ~/.claude/kanban-dbs
ln -s "$ONEDRIVE/dev/ai-kanban/images" ~/.claude/kanban-images

ls ~/.claude/kanban-dbs/   # DB files uploaded from macOS should appear
```

---

### Concurrent write safety

| Scenario | Result |
|---|---|
| PC1: `unahouse.finance`, PC2: `jira.javis` simultaneously | ✅ Separate files — no WAL conflict |
| PC1 and PC2 on the same project simultaneously | ⚠️ Same DB — work sequentially |
