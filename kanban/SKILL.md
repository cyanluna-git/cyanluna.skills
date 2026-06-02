---
name: kanban
description: Manage project tasks in a local SQLite DB (~/.claude/kanban-dbs/{project}.db). Supports task CRUD (add, edit, move, remove), board viewing, session context persistence, and statistics. For pipeline orchestration use /kanban-run, for requirements refinement use /kanban-refine. Run /kanban-init first to create the local DB.
license: MIT
---

> Shared context: read `shared.md` for DB path, pipeline levels, status transitions, DB operations, error handling, and agent context flow.
> Safety principles: read `principles.md` — **mandatory, not optional.**

## Commands

### `/kanban` or `/kanban list` — View Board

```bash
BOARD_JSON=$(sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level, current_agent FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id")
```

Python으로 column별 그룹화 후 markdown table 출력 (ID, Status, Priority, Title).

### `/kanban context` — Session Handoff

**Run first when starting a new session.** Fetch board and output pipeline state:
Implementing / Plan Review / Impl Review / Testing / Recently Done / Next Todo.

```bash
BOARD_JSON=$(sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level, current_agent FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id")
```

### `/kanban context save` — Save Session State

Captures current board state + git branch + decisions made this session to `.claude/kanban-context.md`.
Use before ending a session so the next session can resume without context loss.

```bash
BOARD_JSON=$(sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id")
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
DIRTY=$(git diff --stat 2>/dev/null | tail -1 || echo "")
```

Write `.claude/kanban-context.md` with:
1. **Saved at**: timestamp + branch
2. **In Progress**: tasks currently in `impl` / `impl_review` / `test` columns (ID, title, status)
3. **Pending Review**: tasks in `plan_review` or `impl_review` (needs human decision)
4. **Next Todo**: first task in `todo` column
5. **Git State**: branch name, dirty working tree summary (`$DIRTY`)
6. **Decisions this session**: ask user "Any decisions to note before saving?" and append their answer verbatim

Add `.claude/kanban-context.md` to `.gitignore` if not already present.

### `/kanban context restore` — Restore Session State

Loads `.claude/kanban-context.md` if it exists, then fetches live board to show what changed since save.
Use at session start instead of `/kanban context` when you were mid-task last session.

```bash
SAVED=$(cat .claude/kanban-context.md 2>/dev/null || echo "")
BOARD_JSON=$(sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id")
```

Output:
1. Show saved state (what was in progress, decisions noted)
2. Show current live board state
3. Highlight any status changes since the save (tasks that moved columns)
4. Suggest: "Resume task #ID [title]?" for the first in-progress task

### `/kanban add <title>` — Add Task

1. Ask user for priority, level (L1/L2/L3), description, tags (use AskUserQuestion)
2. Use Python sqlite3 for safe insert with user text (see shared.md → JSON Safety)
3. Output confirmation with new task ID

### `/kanban move <ID> <status>` — Move Task

> **반드시 `shared.md` → Move Protocol 순서를 따를 것.**
> Step 1(현재 status+level 확인) → Step 2(매트릭스 조회) → Step 3(유효성 검사 후 이동 실행).
> 유효하지 않은 전환 시 오류 출력, 사용자에게 올바른 다음 상태 안내.

### `/kanban edit <ID>` — Edit Task

Ask user which fields to modify, then update via sqlite3 CLI.

### `/kanban remove <ID>` — Delete Task

```bash
sqlite3 "$DB" "DELETE FROM tasks WHERE id=$ID AND project='$PROJECT'"
```

### `/kanban stats` — Statistics

```bash
BOARD_JSON=$(sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level, agent_log FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id")
python3 << 'PY'
import json, sys
from collections import defaultdict

rows = json.loads(sys.stdin.read())
board = {}
for row in rows:
    board.setdefault(row['status'], []).append(row)

columns = ['todo', 'plan', 'plan_review', 'impl', 'impl_review', 'test', 'done']

# Column counts
counts = {col: len(board.get(col, [])) for col in columns}
counts['total'] = sum(counts.values())
print("## Column Counts\n")
print("| Status | Count |")
print("|--------|-------|")
for col in columns:
    print(f"| {col} | {counts[col]} |")
print(f"| **total** | **{counts['total']}** |")

# Token stats per agent
agent_stats = defaultdict(lambda: {'entries': 0, 'tokens': 0})
for col in columns:
    for task in board.get(col, []):
        raw = task.get('agent_log')
        if not raw:
            continue
        try:
            logs = json.loads(raw) if isinstance(raw, str) else raw
        except (json.JSONDecodeError, TypeError):
            continue
        for entry in logs:
            agent = entry.get('agent', 'unknown')
            agent_stats[agent]['entries'] += 1
            agent_stats[agent]['tokens'] += entry.get('tokens', 0)

total_tokens = sum(v['tokens'] for v in agent_stats.values())
total_entries = sum(v['entries'] for v in agent_stats.values())

print("\n## Agent Token Usage\n")
if total_tokens == 0:
    print("No token data")
else:
    print("| Agent | Entries | Tokens (est.) |")
    print("|-------|---------|---------------|")
    for agent in sorted(agent_stats):
        s = agent_stats[agent]
        print(f"| {agent} | {s['entries']} | {s['tokens']:,} |")
    print(f"| **Total** | **{total_entries}** | **{total_tokens:,}** |")
PY
```

Pass BOARD_JSON to stdin: `echo "$BOARD_JSON" | python3 - <<'PY' ...`

### `/kanban stats health` — Code Health Score

Auto-detects available tools and computes a 0–10 composite code health score.
Use when: "health check", "코드 품질 확인", "how healthy is this codebase".

```bash
python3 - <<'PY'
import subprocess, json, sys

checks = []

def run(cmd, label, parse=None):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        ok = r.returncode == 0
        detail = parse(r) if parse else ""
        checks.append({"label": label, "ok": ok, "detail": detail})
    except FileNotFoundError:
        pass  # tool not installed — skip silently
    except subprocess.TimeoutExpired:
        checks.append({"label": label, "ok": False, "detail": "timeout"})

# TypeScript
run(["npx", "--no", "tsc", "--noEmit", "--pretty", "false"],
    "TypeScript",
    lambda r: f"{r.stdout.count('error TS')} errors" if r.returncode != 0 else "")

# Python type check (pyright preferred, mypy fallback)
if subprocess.run(["which", "pyright"], capture_output=True).returncode == 0:
    run(["pyright", "--outputjson"], "Pyright",
        lambda r: f"{json.loads(r.stdout).get('summary',{}).get('errorCount',0)} errors" if r.stdout else "")
elif subprocess.run(["which", "mypy"], capture_output=True).returncode == 0:
    run(["mypy", ".", "--ignore-missing-imports"], "mypy",
        lambda r: r.stdout.strip().split('\n')[-1] if r.stdout else "")

# Linter
if subprocess.run(["which", "ruff"], capture_output=True).returncode == 0:
    run(["ruff", "check", "--statistics"], "ruff",
        lambda r: r.stdout.strip().split('\n')[0] if r.stdout else "")
elif subprocess.run(["npx", "--no", "eslint", "--version"], capture_output=True).returncode == 0:
    run(["npx", "--no", "eslint", ".", "--max-warnings=0"], "ESLint",
        lambda r: f"{r.stdout.count('warning') + r.stdout.count('error')} issues" if r.returncode != 0 else "")

# Tests
if subprocess.run(["which", "pytest"], capture_output=True).returncode == 0:
    run(["pytest", "--tb=no", "-q"], "pytest",
        lambda r: r.stdout.strip().split('\n')[-1] if r.stdout else "")
elif subprocess.run(["npx", "--no", "jest", "--version"], capture_output=True).returncode == 0:
    run(["npx", "--no", "jest", "--passWithNoTests", "--silent"], "Jest",
        lambda r: r.stderr.strip().split('\n')[-1] if r.stderr else "")

# Rust
run(["cargo", "check", "--quiet"], "cargo check")

# Shell lint
if subprocess.run(["which", "shellcheck"], capture_output=True).returncode == 0:
    sh_files = subprocess.run(["find", ".", "-name", "*.sh", "-not", "-path", "*/.git/*"],
                               capture_output=True, text=True).stdout.strip().split()
    if sh_files:
        run(["shellcheck"] + sh_files[:20], "shellcheck",
            lambda r: f"{r.stdout.count('SC')} warnings" if r.returncode != 0 else "")

# Score
if not checks:
    print("## Code Health\nNo supported tools found (tsc/pyright/ruff/pytest/jest/cargo/shellcheck).")
    sys.exit(0)

passed = sum(1 for c in checks if c["ok"])
score = round(passed / len(checks) * 10, 1)
grade = "🟢" if score >= 8 else "🟡" if score >= 5 else "🔴"

print(f"## Code Health: {grade} {score}/10  ({passed}/{len(checks)} checks passed)\n")
print("| Check | Status | Detail |")
print("|-------|--------|--------|")
for c in checks:
    icon = "✅" if c["ok"] else "❌"
    print(f"| {c['label']} | {icon} | {c['detail'] or ''} |")
PY
```

### `/kanban retro` — Retrospective Analysis

Analyzes completed tasks + git history to produce a sprint retrospective report.
Use at end of week/sprint: "kanban retro", "주간 회고", "what did we ship this week".

```bash
BOARD_JSON=$(sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level, agent_log, impl_review_count FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id")
python3 - <<'PY'
import json, sys, subprocess
from collections import defaultdict

rows = json.loads(sys.stdin.read())
board = {}
for row in rows:
    board.setdefault(row['status'], []).append(row)

columns = ['todo', 'plan', 'plan_review', 'impl', 'impl_review', 'test', 'done']
done_tasks = board.get('done', [])

print("## Retrospective\n")

# --- Completed tasks ---
print(f"### Completed: {len(done_tasks)} tasks\n")
if done_tasks:
    print("| ID | Title | Level | Rework |")
    print("|----|-------|-------|--------|")
    for t in done_tasks[-10:]:
        rework = t.get('impl_review_count', 0) or 0
        flag = f"⚠️ {rework}x" if rework > 1 else "✅"
        print(f"| {t.get('id','')} | {t.get('title','')[:45]} | L{t.get('level',1)} | {flag} |")

# --- Rework rate ---
rework_tasks = [t for t in done_tasks if (t.get('impl_review_count') or 0) > 1]
rate = len(rework_tasks) / len(done_tasks) * 100 if done_tasks else 0
print(f"\n**Rework rate**: {rate:.0f}% ({len(rework_tasks)}/{len(done_tasks)} tasks needed re-impl)")

# --- Pipeline snapshot (non-done) ---
snapshot = {col: len(board.get(col, [])) for col in columns[:-1] if board.get(col)}
if snapshot:
    print("\n### Pipeline Snapshot\n")
    print("| Column | Count |")
    print("|--------|-------|")
    for col, count in snapshot.items():
        print(f"| {col} | {count} |")

# --- Agent token spend (done tasks) ---
agent_stats = defaultdict(lambda: {'entries': 0, 'tokens': 0})
for t in done_tasks:
    raw = t.get('agent_log')
    if not raw:
        continue
    try:
        logs = json.loads(raw) if isinstance(raw, str) else raw
    except (json.JSONDecodeError, TypeError):
        continue
    for entry in logs:
        a = entry.get('agent', 'unknown')
        agent_stats[a]['entries'] += 1
        agent_stats[a]['tokens'] += entry.get('tokens', 0)

total = sum(v['tokens'] for v in agent_stats.values())
if total > 0:
    print(f"\n### Token Spend (completed): {total:,} est.\n")
    print("| Agent | Tokens |")
    print("|-------|--------|")
    for a in sorted(agent_stats, key=lambda x: -agent_stats[x]['tokens']):
        print(f"| {a} | {agent_stats[a]['tokens']:,} |")

# --- Git commits ---
git = subprocess.run(
    ['git', 'log', '--oneline', '--since=7 days ago'],
    capture_output=True, text=True
)
commits = [l for l in git.stdout.strip().split('\n') if l]
if commits:
    print(f"\n### Git Activity: {len(commits)} commits (last 7 days)")
PY
```

Pass BOARD_JSON to stdin. To scope to a custom period (e.g. 14 days), adjust `--since=14 days ago` in the git subprocess call.

### `/kanban project` — Current Project Context

Fetch the current project's context from the projects table.

```bash
sqlite3 -json "$DB" "SELECT * FROM projects WHERE id='$PROJECT'"
```

Output formatted project context: Purpose, Stack, Brief, Category, task counts by status, linked projects.

If the project is not registered, suggest running `/kanban-init` to register it.

### `/kanban project all` — Full Project Map

```bash
sqlite3 -json "$DB" "SELECT id, name, purpose, status, category FROM projects ORDER BY category, name"
```

Output: projects grouped by category with names and purposes.

### `/kanban project brief` — View/Update Project Brief

The **brief** is a compressed context summary (200–500 chars) that agents consume at low token cost.

**View current brief:**
```bash
sqlite3 "$DB" "SELECT brief FROM projects WHERE id='$PROJECT'"
```

**Set brief directly:**
```bash
sqlite3 "$DB" "UPDATE projects SET brief='...' WHERE id='$PROJECT'"
```

**AI-assisted update (`/kanban project brief update`):**
1. Fetch current project info + recent done tasks
2. Analyze: current state, recent completions, active direction
3. Draft a concise brief (200–500 chars) covering: what exists now, where we're heading, recent key decisions
4. Present to user for confirmation → sqlite3 UPDATE to save

### `/kanban project update <field> <value>` — Edit Project Metadata

```bash
sqlite3 "$DB" "UPDATE projects SET purpose='...' WHERE id='$PROJECT'"
sqlite3 "$DB" "UPDATE projects SET status='archived' WHERE id='$PROJECT'"
```

Supported fields: `name`, `purpose`, `stack`, `brief`, `status`, `category`, `repo_url`.

### `/kanban project link` — Manage Project Relationships

```bash
# Add relationship
sqlite3 "$DB" "INSERT OR IGNORE INTO project_links (source_id, target_id, relation) VALUES ('$PROJECT', 'other-project', 'depends_on')"

# Remove relationship
sqlite3 "$DB" "DELETE FROM project_links WHERE source_id='$PROJECT' AND target_id='other-project' AND relation='depends_on'"

# List links
sqlite3 -json "$DB" "SELECT * FROM project_links WHERE source_id='$PROJECT'"
```

Relations: `extends`, `serves`, `depends_on`, `shares_data`.

## Setup

Run `/kanban-init` first to create the local SQLite DB and register the project.

Add to `.gitignore`:
```
.claude/kanban.json
.codex/kanban.json
.claude/kanban-context.md
```

DB is stored at `~/.claude/kanban-dbs/<PROJECT>.db` — not in the project directory.
