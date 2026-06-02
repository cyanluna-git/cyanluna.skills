---
name: kanban-heartbeat
description: Scan kanban boards for stagnant tasks and optionally mark them. Detects tasks with no agent activity for N days (default 3), outputs a markdown report table, and appends Heartbeat entries to agent_log unless --dry-run.
license: MIT
---

> Shared context: read `../kanban/shared.md` for DB path, pipeline levels, status transitions, DB operations, error handling, and agent context flow.
> Schema: read `../kanban/schema.md` for full DB schema, column descriptions, and JSON field formats.

## `/kanban-heartbeat [--project X] [--days N] [--dry-run]` -- Stagnant Task Detection

Scan all active projects (or a single project) for tasks that have had no agent activity for N days. Output a markdown table of stagnant tasks and optionally append a Heartbeat warning entry to each task's `agent_log`.

**Defaults**: `--days 3`, all active projects, writes to `agent_log`.
**`--dry-run`**: report only, no `agent_log` modifications.

### Procedure

```
① DB Setup & Argument Parsing

   Read project config and DB path:
   CONFIG=$(cat .claude/kanban.json 2>/dev/null || cat .codex/kanban.json 2>/dev/null)
   PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")
   DB="$HOME/.claude/kanban-dbs/${PROJECT}.db"

   Parse CLI arguments:
   - --project X  → scan only project X (override PROJECT)
   - --days N     → stagnation threshold in days (default: 3)
   - --dry-run    → report only, do not write agent_log entries

② Fetch Projects

   If --project X specified:
     Validate project exists:
     sqlite3 "$DB" "SELECT id FROM projects WHERE id='$X'"
     If empty → print error "Project '$X' not found." and exit.
     PROJECTS=("$X")

   Else:
     PROJECTS = sqlite3 "$DB" "SELECT id FROM projects WHERE status='active'"
     If no active projects → scan using PROJECT from config

③ Fetch Tasks per Project (active columns only)

   For each project P in PROJECTS:
     sqlite3 -json "$DB" "SELECT id, title, status, agent_log, created_at FROM tasks
       WHERE project='$P' AND status IN ('todo','plan','plan_review','impl','impl_review','test')
       ORDER BY id"

     If project has 0 tasks → skip silently, continue.

④ Extract Last Activity Timestamp per Task

   For each task, use Python for safe JSON parsing of agent_log:

   python3 -c "
   import json, sys
   task = json.loads(sys.stdin.read())
   agent_log_raw = task.get('agent_log') or '[]'
   try:
       log = json.loads(agent_log_raw)
       if isinstance(log, list) and len(log) > 0:
           timestamps = [e.get('timestamp', '') for e in log if isinstance(e, dict)]
           timestamps = [t for t in timestamps if t]
           if timestamps:
               print(max(timestamps))
               sys.exit(0)
   except (json.JSONDecodeError, TypeError):
       print('PARSE_ERROR', file=sys.stderr)
   # Fallback to created_at
   print(task.get('created_at', ''))
   "

   Store: task ID, project, status, title, last_activity_ts

⑤ Compute Stagnation

   NOW = current UTC timestamp
   THRESHOLD = NOW - N days

   For each task:
     Parse last_activity_ts as datetime
     days_stagnant = (NOW - last_activity_ts).days
     If days_stagnant >= N → mark as stagnant

   If no stagnant tasks across all projects:
     Print "No stagnant tasks found."
     Exit.

⑥ Output Markdown Table

   Sort stagnant tasks by days_stagnant descending.

   Print:

   | ID | Project | Status | Days | Title |
   |----|---------|--------|------|-------|
   | 2100 | cpet.db | impl | 12 | Add export feature |
   | 2055 | today.bike | plan | 5 | Refactor route module |

   Print summary line:
   "**Heartbeat: X stagnant tasks found across Y projects.**"
   If --dry-run: append " (dry-run, no agent_log entries written)"

⑦ Write agent_log Entries (skip if --dry-run)

   For each stagnant task, append a Heartbeat entry using sqlite3 json_insert:

   NEW_ENTRY=$(python3 -c "
   import json, datetime
   entry = {
     'agent': 'Heartbeat',
     'model': 'system',
     'message': f'⚠️ Stagnant {DAYS} days in {STATUS}. Last activity: {LAST_TS}',
     'timestamp': datetime.datetime.utcnow().isoformat() + 'Z'
   }
   print(json.dumps(entry))
   ")
   sqlite3 "$DB" "UPDATE tasks SET agent_log=json_insert(COALESCE(agent_log,'[]'), '\$[#]', json('$NEW_ENTRY')), updated_at=datetime('now') WHERE id=$TASK_ID AND project='$PROJECT'"
   echo "  Heartbeat written to task #$TASK_ID"

   Print: "agent_log entries written for X tasks."
```

### Full Implementation (Copy-Paste Script)

The executing agent should run this as a single Python script for reliability:

```bash
python3 - "$@" <<'PYEOF'
import sqlite3 as sq, json, sys, datetime, re, os, pathlib

# ── Parse arguments ──────────────────────────────────────────────
args = sys.argv[1:]
project_filter = None
days_threshold = 3
dry_run = False

i = 0
while i < len(args):
    if args[i] == "--project" and i + 1 < len(args):
        project_filter = args[i + 1]; i += 2
    elif args[i] == "--days" and i + 1 < len(args):
        days_threshold = int(args[i + 1]); i += 2
    elif args[i] == "--dry-run":
        dry_run = True; i += 1
    else:
        i += 1

# ── DB Setup ─────────────────────────────────────────────────────
import subprocess
config_paths = [".claude/kanban.json", ".codex/kanban.json"]
project_name = None
for p in config_paths:
    if os.path.exists(p):
        try:
            d = json.loads(open(p).read())
            project_name = d.get("project")
            break
        except Exception:
            pass
if not project_name:
    project_name = os.path.basename(os.getcwd())

db_path = str(pathlib.Path.home() / ".claude" / "kanban-dbs" / f"{project_name}.db")
if not os.path.exists(db_path):
    print(f"Error: DB not found at {db_path}. Run /kanban-init first.")
    sys.exit(1)

conn = sq.connect(db_path)
conn.row_factory = sq.Row

# ── Fetch projects ───────────────────────────────────────────────
if project_filter:
    row = conn.execute("SELECT id FROM projects WHERE id=?", (project_filter,)).fetchone()
    if not row:
        # Fall back: check if project has tasks even without projects table entry
        count = conn.execute("SELECT count(*) FROM tasks WHERE project=?", (project_filter,)).fetchone()[0]
        if count == 0:
            print(f"Error: Project '{project_filter}' not found.")
            sys.exit(1)
    projects = [project_filter]
else:
    rows = conn.execute("SELECT id FROM projects WHERE status='active'").fetchall()
    projects = [r["id"] for r in rows]
    if not projects:
        # Fall back to the project from config
        projects = [project_name]

if not projects:
    print("No active projects found.")
    sys.exit(0)

# ── Scan tasks ───────────────────────────────────────────────────
now = datetime.datetime.utcnow()
active_columns = ("todo", "plan", "plan_review", "impl", "impl_review", "test")
stagnant_tasks = []

for proj in projects:
    rows = conn.execute(
        "SELECT id, title, status, agent_log, created_at FROM tasks WHERE project=? AND status IN ({})".format(
            ",".join("?" * len(active_columns))
        ),
        (proj, *active_columns)
    ).fetchall()

    for task in rows:
        task_id = task["id"]
        title = task["title"] or "(untitled)"
        status = task["status"]
        created_at = task["created_at"] or ""
        agent_log_raw = task["agent_log"]

        # Extract last activity timestamp
        last_ts = None
        parse_error = False
        if agent_log_raw:
            try:
                log = json.loads(agent_log_raw) if isinstance(agent_log_raw, str) else agent_log_raw
                if isinstance(log, list) and len(log) > 0:
                    timestamps = [e.get("timestamp", "") for e in log if isinstance(e, dict)]
                    timestamps = [t for t in timestamps if t]
                    if timestamps:
                        last_ts = max(timestamps)
            except (json.JSONDecodeError, TypeError):
                parse_error = True

        if last_ts is None:
            last_ts = created_at
            if parse_error:
                print(f"Warning: task #{task_id} has malformed agent_log, falling back to created_at", file=sys.stderr)

        if not last_ts:
            print(f"Warning: task #{task_id} has no timestamp, skipping", file=sys.stderr)
            continue

        # Parse timestamp
        try:
            clean_ts = re.sub(r"\.\d+", "", last_ts.replace("Z", "").replace("+00:00", ""))
            ts_dt = datetime.datetime.fromisoformat(clean_ts)
        except (ValueError, AttributeError):
            print(f"Warning: task #{task_id} has unparseable timestamp '{last_ts}', skipping", file=sys.stderr)
            continue

        days_stagnant = (now - ts_dt).days
        if days_stagnant >= days_threshold:
            stagnant_tasks.append({
                "id": task_id,
                "project": proj,
                "status": status,
                "days": days_stagnant,
                "title": title,
                "last_ts": last_ts,
            })

# ── Output ───────────────────────────────────────────────────────
if not stagnant_tasks:
    print("No stagnant tasks found.")
    sys.exit(0)

stagnant_tasks.sort(key=lambda t: t["days"], reverse=True)

print("")
print("| ID | Project | Status | Days | Title |")
print("|----|---------|--------|------|-------|")
for t in stagnant_tasks:
    print(f"| {t['id']} | {t['project']} | {t['status']} | {t['days']} | {t['title']} |")
print("")

project_set = set(t["project"] for t in stagnant_tasks)
summary = f"**Heartbeat: {len(stagnant_tasks)} stagnant tasks found across {len(project_set)} projects.**"
if dry_run:
    summary += " (dry-run, no agent_log entries written)"
print(summary)

# ── Write agent_log entries ──────────────────────────────────────
if dry_run:
    sys.exit(0)

print("")
written = 0
for t in stagnant_tasks:
    try:
        row = conn.execute("SELECT agent_log FROM tasks WHERE id=? AND project=?", (t["id"], t["project"])).fetchone()
        try:
            log = json.loads(row["agent_log"] or "[]")
        except (json.JSONDecodeError, TypeError):
            log = []

        log.append({
            "agent": "Heartbeat",
            "model": "system",
            "message": f"⚠️ Stagnant {t['days']} days in {t['status']}. Last activity: {t['last_ts']}",
            "timestamp": now.isoformat() + "Z",
        })

        conn.execute(
            "UPDATE tasks SET agent_log=?, updated_at=datetime('now') WHERE id=? AND project=?",
            (json.dumps(log), t["id"], t["project"])
        )
        conn.commit()
        print(f"  Heartbeat written to task #{t['id']}")
        written += 1
    except Exception as e:
        print(f"  Error writing to task #{t['id']}: {e}", file=sys.stderr)

print(f"\nagent_log entries written for {written} tasks.")
conn.close()
PYEOF
```
