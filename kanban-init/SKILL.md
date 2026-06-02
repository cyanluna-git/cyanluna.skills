---
name: kanban-init
description: "Initialize the current project in local SQLite kanban. Creates ~/.claude/kanban-dbs/{project}.db and writes local config. Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init."
license: MIT
---

Initializes the current project with a **local SQLite** kanban database at `~/.claude/kanban-dbs/{project}.db`.
No server, no auth, no internet required — everything runs locally.

## Usage

```
/kanban-init                           — project name = basename of current directory
/kanban-init my-project-name           — explicit project name
```

Strip any leading dashes from the project token: `/kanban-init -unahouse.finance` → project `unahouse.finance`.

## Procedure

### 1. Determine project name

```bash
ARG="${1:-}"
PROJECT=$(printf '%s' "$ARG" | sed 's/^-*//' | sed 's/\.db$//')
if [ -z "$PROJECT" ]; then
  PROJECT=$(basename "$(pwd)" | sed 's/\.db$//')
fi
DB="$HOME/.claude/kanban-dbs/${PROJECT}.db"
```

**Always strip `.db` suffix** — old configs stored the DB filename as the project name (e.g. `cpet.db`).

### 2. Write local project config

Create in the **current project root**:
- `.claude/kanban.json`
- `.codex/kanban.json` (for Codex compatibility)

```json
{
  "project": "<PROJECT_NAME>"
}
```

Use the Write tool to create both files with the same content.

### 3. Create SQLite database

```bash
mkdir -p "$HOME/.claude/kanban-dbs"
sqlite3 "$DB" << 'SQL'
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT,
  plan TEXT,
  implementation_notes TEXT,
  tags TEXT DEFAULT '[]',
  review_comments TEXT DEFAULT '[]',
  plan_review_comments TEXT DEFAULT '[]',
  test_results TEXT DEFAULT '[]',
  agent_log TEXT DEFAULT '[]',
  notes TEXT DEFAULT '[]',
  current_agent TEXT,
  plan_review_count INTEGER NOT NULL DEFAULT 0,
  impl_review_count INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 3,
  attachments TEXT DEFAULT '[]',
  decision_log TEXT,
  done_when TEXT,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  planned_at TEXT,
  reviewed_at TEXT,
  tested_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  purpose TEXT,
  stack TEXT,
  brief TEXT,
  status TEXT DEFAULT 'active',
  category TEXT,
  repo_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS project_links (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id, relation)
);
SQL
```

If the DB already exists (table already created), `CREATE TABLE IF NOT EXISTS` is idempotent — safe to run again.

### 4. Register project metadata (best-effort)

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

# Infer purpose from CLAUDE.md
PURPOSE=$(grep -v '^#' CLAUDE.md 2>/dev/null | grep -v '^---' | grep -v '^\s*$' | head -1 | cut -c1-300 || echo "")

# Infer repo_url from git remote
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
```

Then upsert into projects table:

```bash
sqlite3 "$DB" "INSERT OR REPLACE INTO projects (id, name, category, repo_url) VALUES ('$PROJECT', '$PROJECT', '$CATEGORY', '$REPO_URL')"
```

If PURPOSE is set:
```bash
sqlite3 "$DB" "UPDATE projects SET purpose='$PURPOSE' WHERE id='$PROJECT'"
```

This is best-effort — if it fails (e.g., sqlite3 not found), init still continues.

### 5. Output confirmation

```
✅ Project '<PROJECT_NAME>' initialized.

  Config:  .claude/kanban.json, .codex/kanban.json
  DB:      ~/.claude/kanban-dbs/<PROJECT_NAME>.db
  Tables:  tasks, projects, project_links

Add tasks with /kanban add <title>
```

## Notes

### Existing config detection

If either `.claude/kanban.json` or `.codex/kanban.json` already exists:
1. Read the `project` field and **strip `.db` suffix** (old format stored DB filename as project name)
2. If the cleaned name differs from what's stored, show the migration clearly
3. Ask the user whether to overwrite or keep as-is:

```
.claude/kanban.json already exists:
  Current project: "cpet.db"  →  will use "cpet" (stripped .db suffix)

Options:
1. Overwrite — update config
2. Keep as-is — leave existing config unchanged
```

### Migrating from PostgreSQL kanban

If the user had a PostgreSQL-based kanban (prior `kanban-auth` setup):
- The old `~/.claude/kanban-auth` file is no longer needed for the SQLite version
- Data migration from PostgreSQL → SQLite is not automated; start fresh or export manually
- Tasks in the old PostgreSQL DB are not accessible from the SQLite version

### sqlite3 requirement

The `sqlite3` CLI must be installed on the system:
```bash
# Debian/Ubuntu
apt install sqlite3

# macOS (usually pre-installed)
brew install sqlite
```

Verify: `sqlite3 --version`
