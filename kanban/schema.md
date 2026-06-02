# Kanban DB Schema & Data Formats

## Table: tasks

```sql
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
```

| Column | Type | Description |
|--------|------|-------------|
| `project` | TEXT | Project identifier |
| `status` | TEXT | `todo` / `plan` / `plan_review` / `impl` / `impl_review` / `test` / `done` |
| `priority` | TEXT | `high` / `medium` / `low` |
| `description` | TEXT | Requirements in markdown |
| `plan` | TEXT | Implementation plan in markdown |
| `implementation_notes` | TEXT | Implementation log in markdown |
| `tags` | TEXT | JSON array string (e.g., `'["api","ui"]'`) |
| `review_comments` | TEXT | JSON array of impl review objects |
| `plan_review_comments` | TEXT | JSON array of plan review objects |
| `test_results` | TEXT | JSON array of test result objects |
| `agent_log` | TEXT | JSON array of agent activity entries |
| `current_agent` | TEXT | Currently active agent name |
| `plan_review_count` | INTEGER | Plan review iteration count |
| `impl_review_count` | INTEGER | Impl review iteration count |
| `level` | INTEGER | Pipeline level: 1 (Quick), 2 (Standard), 3 (Full) |
| `attachments` | TEXT | JSON array of attachment file names |
| `notes` | TEXT | JSON array of note objects |
| `decision_log` | TEXT | Key architecture decisions by Planner (markdown table) |
| `done_when` | TEXT | Verifiable completion criteria written by Planner (markdown checklist) |
| `rank` | INTEGER | Display order within column |

## Agent Nicknames

Each agent has a fixed nickname used in all log records, field headers, and `current_agent`.

| Nickname | Role | Model Key | Writes to |
|----------|------|-------|-----------|
| `Planner` | Plan Agent | `planner` | `plan`, `decision_log`, `done_when` |
| `Critic` | Plan Review Agent | `critic` | `plan_review_comments` |
| `Builder` | Worker Agent | `builder` | `implementation_notes` |
| `Shield` | TDD Tester | `shield` | `implementation_notes` (append) |
| `Inspector` | Code Review Agent | `inspector` | `review_comments` |
| `Ranger` | Test Runner | `ranger` | `test_results` |

## Signature Header Rule

**Every agent MUST prepend a signature header** to the content it writes:

```markdown
> **Planner** `<MODEL_PLANNER>` · 2026-02-24T10:00:00Z
```

This makes every card field self-documenting — you can see at a glance who wrote what and when.

## JSON Formats

### review_comments / plan_review_comments
```json
[
  {
    "reviewer": "Inspector",
    "model": "<MODEL_INSPECTOR>",
    "status": "changes_requested",
    "comment": "> **Inspector** `<MODEL_INSPECTOR>` · 2026-02-20T14:30:00Z\n\n## Review Findings\n\n1. Missing error handling",
    "timestamp": "2026-02-20T14:30:00.000Z"
  }
]
```
`status` must be `"approved"` or `"changes_requested"`.
`reviewer` must be the agent's **nickname** (e.g. `"Inspector"`, `"Critic"`).

### test_results
```json
[
  {
    "tester": "Ranger",
    "model": "<MODEL_RANGER>",
    "status": "pass",
    "lint": "0 errors, 0 warnings",
    "build": "Build successful",
    "tests": "42 passed, 0 failed",
    "comment": "> **Ranger** `<MODEL_RANGER>` · 2026-02-20T15:00:00Z\n\nAll checks passed.",
    "timestamp": "2026-02-20T15:00:00.000Z"
  }
]
```
`status` must be `"pass"` or `"fail"`.
`tester` must be the agent's **nickname** (`"Ranger"`).

### agent_log
Every entry must include `agent` (nickname), `model`, `message`, and `timestamp`.
Optional: `"tokens"?: number` — estimated total tokens (input + output) consumed by the agent for this step.

```json
[
  {
    "agent": "Planner",
    "model": "<MODEL_PLANNER>",
    "message": "Plan complete. 4 files to modify, 2 new components.",
    "tokens": 12000,
    "timestamp": "2026-02-20T10:05:00.000Z"
  },
  {
    "agent": "Critic",
    "model": "<MODEL_CRITIC>",
    "message": "Plan approved. No major issues.",
    "tokens": 8000,
    "timestamp": "2026-02-20T10:10:00.000Z"
  },
  {
    "agent": "Builder",
    "model": "<MODEL_BUILDER>",
    "message": "Implementation complete. All files modified per plan.",
    "tokens": 25000,
    "timestamp": "2026-02-20T11:00:00.000Z"
  }
]
```

**Token Estimation Guide**: Agents estimate their own usage based on context size + output length.
Example: context ~8k input + ~2k output → `"tokens": 10000`
If unknown or uncertain, omit the field — missing tokens count as 0 in stats.

## Appending to agent_log (orchestrator)

After each agent completes, the orchestrator appends a signed entry using SQLite `json_insert`:

```bash
NEW_ENTRY=$(python3 -c "
import json, datetime
entry = {
  'agent': 'NICKNAME',
  'model': 'MODEL',
  'message': 'MESSAGE',
  'tokens': TOKENS,
  'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
}
print(json.dumps(entry))
")
sqlite3 "\$DB" "UPDATE tasks SET agent_log=json_insert(COALESCE(agent_log,'[]'), '\$[#]', json('\$NEW_ENTRY')), updated_at=datetime('now') WHERE id=\$ID AND project='\$PROJECT'"
```

Replace `NICKNAME` with the agent's nickname (e.g. `Planner`, `Builder`), and `MODEL` with the resolved value from `models.json`. Omit `tokens` if unknown.

## Table: projects

```sql
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
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Project identifier (matches kanban.json `project` field) |
| `name` | TEXT | Display name (often same as id) |
| `purpose` | TEXT | WHY this project exists — used for AI context docking |
| `stack` | TEXT | Technologies / frameworks used |
| `brief` | TEXT | Compressed project context: current state + direction + recent decisions. Injected into agent prompts for low-token-cost project awareness |
| `status` | TEXT | `active` / `archived` / `paused` |
| `category` | TEXT | Grouping: `edwards`, `personal`, `tools`, `skills`, `community` |
| `repo_url` | TEXT | Git remote URL |

## Table: project_links

```sql
CREATE TABLE IF NOT EXISTS project_links (
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  PRIMARY KEY (source_id, target_id, relation)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `source_id` | TEXT | Source project ID (FK to projects) |
| `target_id` | TEXT | Target project ID (FK to projects) |
| `relation` | TEXT | Relationship type: `extends`, `serves`, `depends_on`, `shares_data` |

## Schema Migrations

New columns can be added with `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ...` in SQLite (supported since 3.37.0).
`CREATE TABLE IF NOT EXISTS` in `/kanban-init` is idempotent — safe to run again on existing DBs.
