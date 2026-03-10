# Kanban DB Schema & Data Formats

## Table: tasks

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
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
  decision_log TEXT,
  done_when TEXT,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  planned_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  tested_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
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

```json
[
  {
    "agent": "Planner",
    "model": "<MODEL_PLANNER>",
    "message": "Plan complete. 4 files to modify, 2 new components.",
    "timestamp": "2026-02-20T10:05:00.000Z"
  },
  {
    "agent": "Critic",
    "model": "<MODEL_CRITIC>",
    "message": "Plan approved. No major issues.",
    "timestamp": "2026-02-20T10:10:00.000Z"
  },
  {
    "agent": "Builder",
    "model": "<MODEL_BUILDER>",
    "message": "Implementation complete. All files modified per plan.",
    "timestamp": "2026-02-20T11:00:00.000Z"
  }
]
```

## Appending to agent_log (orchestrator)

After each agent completes, the orchestrator appends a signed entry:

```python
python3 -c "
import subprocess, json, datetime
d = json.loads(subprocess.run(['curl','-s',f'{base_url}/api/task/{task_id}?project={project}', *auth_header], capture_output=True, text=True).stdout)
log = json.loads(d.get('agent_log') or '[]')
log.append({
  'agent': 'NICKNAME',
  'model': 'MODEL',
  'message': 'MESSAGE',
  'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
})
subprocess.run(['curl','-s',*auth_header,'-X','PATCH',f'{base_url}/api/task/{task_id}?project={project}','-H','Content-Type: application/json','-d',json.dumps({'agent_log':json.dumps(log)})], capture_output=True)
"
```

Replace `NICKNAME` with the agent's nickname (e.g. `Planner`, `Builder`), and `MODEL` with the resolved value from `models.json`.

## Schema Migrations

New columns are added with `ADD COLUMN IF NOT EXISTS` in PostgreSQL — idempotent, no try/catch needed.
The `kanban-api.ts` plugin runs migrations automatically on server startup.
