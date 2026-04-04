---
name: kanban-heartbeat
description: Scan kanban boards for stagnant tasks and optionally mark them. Detects tasks with no agent activity for N days (default 3), outputs a markdown report table, and appends Heartbeat entries to agent_log unless --dry-run.
license: MIT
---

> Shared context: read `../kanban/shared.md` for pipeline levels, status transitions, API endpoints, error handling, and agent context flow.
> Schema: read `../kanban/schema.md` for full DB schema, column descriptions, and JSON field formats.

## `/kanban-heartbeat [--project X] [--days N] [--dry-run]` -- Stagnant Task Detection

Scan all active projects (or a single project) for tasks that have had no agent activity for N days. Output a markdown table of stagnant tasks and optionally append a Heartbeat warning entry to each task's `agent_log`.

**Defaults**: `--days 3`, all active projects, writes to `agent_log`.
**`--dry-run`**: report only, no `agent_log` modifications.

### Procedure

```
① Auth & Argument Setup

   Load credentials using the standard shared.md pattern:

   KANBAN_AUTH_FILE="$HOME/.claude/kanban-auth"
   BASE_URL=$(grep '^KANBAN_BASE_URL=' "$KANBAN_AUTH_FILE" | cut -d= -f2-)
   AUTH_TOKEN=$(grep '^KANBAN_AUTH_TOKEN=' "$KANBAN_AUTH_FILE" | cut -d= -f2-)
   AUTH_HEADER=(-H "X-Kanban-Auth: $AUTH_TOKEN")

   Parse CLI arguments:
   - --project X  → scan only project X (default: all active projects)
   - --days N     → stagnation threshold in days (default: 3)
   - --dry-run    → report only, do not write agent_log entries

② Fetch Projects

   If --project X specified:
     Validate project exists:
     curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects/$X"
     If 404 → print error "Project '$X' not found." and exit.
     PROJECTS=("$X")

   Else (all projects):
     ALL=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/projects")
     Extract active projects:
     PROJECTS = jq '.projects[] | select(.status == "active") | .id' from ALL

③ Fetch Board per Project (full view)

   For each project P in PROJECTS:
     BOARD=$(curl -s "${AUTH_HEADER[@]}" "$BASE_URL/api/board?project=$P")

     Collect tasks from columns: todo, plan, plan_review, impl, impl_review, test
     SKIP the done column entirely.

     If project has 0 tasks across all active columns → skip silently, continue.

④ Extract Last Activity Timestamp per Task

   For each task in collected tasks:

     Use Python for safe JSON parsing:

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

     If PARSE_ERROR was emitted to stderr:
       Print warning: "Warning: task #$ID has malformed agent_log, falling back to created_at"

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

   For each stagnant task:

     Use Python for safe JSON construction and API calls:

     python3 -c "
     import subprocess, json, datetime, sys

     task_id = sys.argv[1]
     project = sys.argv[2]
     days = int(sys.argv[3])
     status = sys.argv[4]
     last_ts = sys.argv[5]
     base_url = sys.argv[6]
     auth_token = sys.argv[7]

     auth_header = ['-H', f'X-Kanban-Auth: {auth_token}'] if auth_token else []
     now = datetime.datetime.utcnow().isoformat() + 'Z'

     # Fetch current agent_log
     result = subprocess.run(
         ['curl', '-s', f'{base_url}/api/task/{task_id}?project={project}&fields=agent_log']
         + auth_header,
         capture_output=True, text=True
     )
     data = json.loads(result.stdout)
     try:
         log = json.loads(data.get('agent_log') or '[]')
     except (json.JSONDecodeError, TypeError):
         log = []

     # Append heartbeat entry
     log.append({
         'agent': 'Heartbeat',
         'model': 'system',
         'message': f'⚠️ Stagnant {days} days in {status}. Last activity: {last_ts}',
         'timestamp': now
     })

     # Write back
     payload = json.dumps({'agent_log': json.dumps(log)})
     subprocess.run(
         ['curl', '-s', *auth_header, '-X', 'PATCH',
          f'{base_url}/api/task/{task_id}?project={project}',
          '-H', 'Content-Type: application/json',
          '-d', payload],
         capture_output=True
     )
     print(f'  Heartbeat written to task #{task_id}')
     " "$TASK_ID" "$PROJECT" "$DAYS" "$STATUS" "$LAST_TS" "$BASE_URL" "$AUTH_TOKEN"

   Print: "agent_log entries written for X tasks."
```

### Full Implementation (Copy-Paste Script)

The executing agent should run this as a single Python script for reliability:

```bash
python3 - "$@" <<'PYEOF'
import subprocess, json, sys, datetime, re

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

# ── Auth setup ───────────────────────────────────────────────────
import pathlib, os
auth_file = pathlib.Path.home() / ".claude" / "kanban-auth"
base_url = "http://localhost:5173"
auth_token = ""

if auth_file.exists():
    for line in auth_file.read_text().splitlines():
        if line.startswith("KANBAN_BASE_URL="):
            base_url = line.split("=", 1)[1]
        elif line.startswith("KANBAN_AUTH_TOKEN="):
            auth_token = line.split("=", 1)[1]

def curl_get(url):
    cmd = ["curl", "-s", url]
    if auth_token:
        cmd += ["-H", f"X-Kanban-Auth: {auth_token}"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(r.stdout)

def curl_patch(url, payload):
    cmd = ["curl", "-s", "-X", "PATCH", url, "-H", "Content-Type: application/json", "-d", json.dumps(payload)]
    if auth_token:
        cmd += ["-H", f"X-Kanban-Auth: {auth_token}"]
    subprocess.run(cmd, capture_output=True)

# ── Fetch projects ───────────────────────────────────────────────
if project_filter:
    try:
        proj_data = curl_get(f"{base_url}/api/projects/{project_filter}")
        if "error" in proj_data:
            print(f"Error: Project '{project_filter}' not found.")
            sys.exit(1)
        projects = [project_filter]
    except Exception:
        print(f"Error: Project '{project_filter}' not found.")
        sys.exit(1)
else:
    all_proj = curl_get(f"{base_url}/api/projects")
    projects = [p["id"] for p in all_proj.get("projects", []) if p.get("status") == "active"]

if not projects:
    print("No active projects found.")
    sys.exit(0)

# ── Scan boards ──────────────────────────────────────────────────
now = datetime.datetime.utcnow()
active_columns = ["todo", "plan", "plan_review", "impl", "impl_review", "test"]
stagnant_tasks = []

for proj in projects:
    try:
        board = curl_get(f"{base_url}/api/board?project={proj}")
    except Exception:
        print(f"Warning: failed to fetch board for project '{proj}', skipping.", file=sys.stderr)
        continue

    for col in active_columns:
        tasks = board.get(col, [])
        if not isinstance(tasks, list):
            continue
        for task in tasks:
            task_id = task.get("id")
            title = task.get("title", "(untitled)")
            status = task.get("status", col)
            created_at = task.get("created_at", "")
            agent_log_raw = task.get("agent_log")

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
                print(f"Warning: task #{task_id} has no timestamp at all, skipping", file=sys.stderr)
                continue

            # Parse timestamp and compute days
            try:
                # Handle various ISO formats
                clean_ts = re.sub(r"\.\d+", "", last_ts.replace("Z", "+00:00").replace("+00:00", ""))
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

# Sort by days descending
stagnant_tasks.sort(key=lambda t: t["days"], reverse=True)

# Markdown table
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
        task_data = curl_get(f"{base_url}/api/task/{t['id']}?project={t['project']}&fields=agent_log")
        try:
            log = json.loads(task_data.get("agent_log") or "[]")
        except (json.JSONDecodeError, TypeError):
            log = []

        log.append({
            "agent": "Heartbeat",
            "model": "system",
            "message": f"\u26a0\ufe0f Stagnant {t['days']} days in {t['status']}. Last activity: {t['last_ts']}",
            "timestamp": now.isoformat() + "Z",
        })

        curl_patch(
            f"{base_url}/api/task/{t['id']}?project={t['project']}",
            {"agent_log": json.dumps(log)},
        )
        print(f"  Heartbeat written to task #{t['id']}")
        written += 1
    except Exception as e:
        print(f"  Error writing to task #{t['id']}: {e}", file=sys.stderr)

print(f"\nagent_log entries written for {written} tasks.")
PYEOF
```
