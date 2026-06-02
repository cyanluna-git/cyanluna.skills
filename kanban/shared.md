# Kanban Shared Context

Manages project tasks in **SQLite** (per-project file at `~/.claude/kanban-dbs/{project}.db`).
Local-first: no server, no auth, no internet required.

## DB Path & Project Config

Read project config from `.claude/kanban.json` (created by `/kanban-init`):

```bash
CONFIG=$(cat .claude/kanban.json 2>/dev/null || cat .codex/kanban.json 2>/dev/null)
PROJECT=$(echo "$CONFIG" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['project'])" 2>/dev/null || basename "$(pwd)")
DB="$HOME/.claude/kanban-dbs/${PROJECT}.db"
```

If `.claude/kanban.json` doesn't exist, prompt user to run `/kanban-init`, or fall back to:

```bash
PROJECT=$(basename "$(pwd)")
DB="$HOME/.claude/kanban-dbs/${PROJECT}.db"
```

> **IMPORTANT**: Use `sqlite3` CLI. Do NOT use `python3 -c "import sqlite3..."` for read/update operations — use the CLI directly. Python is only for complex inserts with user-supplied text (see JSON Safety below).

## Pipeline Levels

| Level | Path | Use Case |
|-------|------|----------|
| L1 Quick | `Req → Impl → Done` | File cleanup, config changes, typo fixes |
| L2 Standard | `Req → Plan → Impl → Review → Done` | Feature edits, bug fixes, refactoring |
| L3 Full | `Req → Plan → Plan Rev → Impl → Impl Rev → Test → Done` | New features, architecture changes |

Level is set at task creation and stored in the `level` column.

## 7-Column AI Team Pipeline

```
Req → Plan → Review Plan → Impl → Review Impl → Test → Done
```

| Column | Status | Agent | Model Key |
|--------|--------|-------|-------|
| Req | `todo` | User | - |
| Plan | `plan` | Plan Agent | `planner` |
| Review Plan | `plan_review` | Review Agent | `critic` |
| Impl | `impl` | Worker → TDD Tester (sequential) | `builder` → `shield` |
| Review Impl | `impl_review` | Code Review Agent | `inspector` |
| Test | `test` | Test Runner | `ranger` |
| Done | `done` | - | - |

Model keys are resolved to real provider models through `models.json`.

### Move Protocol (이동 전 필수)

카드를 이동하기 전 반드시 이 순서를 따른다.

**Step 1 — 현재 상태 확인**

```bash
ROW=$(sqlite3 -json "$DB" "SELECT status, level FROM tasks WHERE id=$ID AND project='$PROJECT'")
STATUS=$(echo "$ROW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['status'] if d else '')")
LEVEL=$(echo "$ROW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['level'] if d else 2)")
```

**Step 2 — Level × Status 매트릭스로 다음 상태 결정**

| 현재 Status  | L1 Quick | L2 Standard       | L3 Full                |
|-------------|----------|-------------------|------------------------|
| `todo`      | `impl`   | `plan`            | `plan`                 |
| `plan`      | —        | `impl`            | `plan_review` / `todo` |
| `plan_review` | —      | —                 | `impl` / `plan`        |
| `impl`      | `done`   | `impl_review`     | `impl_review`          |
| `impl_review` | —      | `done` / `impl`   | `test` / `impl`        |
| `test`      | —        | —                 | `done` / `impl`        |
| `done`      | (terminal) | (terminal)      | (terminal)             |

**Step 3 — 전환 유효성 검사 후 이동 실행**

전환이 매트릭스에서 유효하면 실행:

```bash
sqlite3 "$DB" "UPDATE tasks SET status='$NEXT_STATUS', updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"
```

유효하지 않은 전환 시: 오류 메시지 출력, 상태 유지, 사용자에게 매트릭스 기준으로 올바른 다음 상태 안내.

2회 연속 실패 시: 상태 유지, `agent_log`에 실패 내역 기록, 사용자에게 알림.

## DB Access

모든 DB 조작은 `sqlite3` CLI를 사용한다. API 서버 불필요.

### 기본 조작 패턴

```bash
# 보드 전체 조회 (column 그룹화용 flat list)
sqlite3 -json "$DB" \
  "SELECT id, title, status, priority, level, current_agent, tags FROM tasks WHERE project='$PROJECT' ORDER BY status, rank, id"

# 태스크 전체 읽기
sqlite3 -json "$DB" "SELECT * FROM tasks WHERE id=$ID AND project='$PROJECT'"

# 특정 필드만 읽기
sqlite3 -json "$DB" "SELECT id, title, description, plan, status, level FROM tasks WHERE id=$ID AND project='$PROJECT'"

# 상태 업데이트
sqlite3 "$DB" "UPDATE tasks SET status='plan', planned_at=datetime('now'), updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# 여러 필드 동시 업데이트
sqlite3 "$DB" "UPDATE tasks SET plan='...', status='plan_review', updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# 태스크 삭제
sqlite3 "$DB" "DELETE FROM tasks WHERE id=$ID AND project='$PROJECT'"
```

### JSON 필드 조작 (agent_log, review_comments 등)

SQLite의 `json_insert` 함수로 JSON 배열에 항목을 추가한다:

```bash
# agent_log에 항목 추가
NEW_ENTRY=$(python3 -c "
import json
print(json.dumps({'agent':'Planner','model':'opus','message':'...','timestamp':'2026-06-02T00:00:00Z','tokens':1500}))
")
sqlite3 "$DB" "UPDATE tasks SET agent_log=json_insert(COALESCE(agent_log,'[]'), '\$[#]', json('$NEW_ENTRY')), updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# plan_review_comments에 리뷰 추가 (plan_review_count도 증가)
NEW_REVIEW=$(python3 -c "
import json
print(json.dumps({'reviewer':'Critic','model':'sonnet','status':'approved','comment':'...','timestamp':'2026-06-02T00:00:00Z'}))
")
sqlite3 "$DB" "UPDATE tasks SET plan_review_comments=json_insert(COALESCE(plan_review_comments,'[]'), '\$[#]', json('$NEW_REVIEW')), plan_review_count=plan_review_count+1, updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# review_comments에 리뷰 추가 (impl_review_count도 증가)
NEW_REVIEW=$(python3 -c "
import json
print(json.dumps({'reviewer':'Inspector','model':'sonnet','status':'approved','comment':'...','timestamp':'2026-06-02T00:00:00Z'}))
")
sqlite3 "$DB" "UPDATE tasks SET review_comments=json_insert(COALESCE(review_comments,'[]'), '\$[#]', json('$NEW_REVIEW')), impl_review_count=impl_review_count+1, updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# test_results에 테스트 결과 추가
NEW_RESULT=$(python3 -c "
import json
print(json.dumps({'tester':'Ranger','status':'pass','lint':'ok','build':'ok','tests':'5/5','comment':'','timestamp':'2026-06-02T00:00:00Z'}))
")
sqlite3 "$DB" "UPDATE tasks SET test_results=json_insert(COALESCE(test_results,'[]'), '\$[#]', json('$NEW_RESULT')), updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# notes에 노트 추가 (커밋 해시 등)
sqlite3 "$DB" "UPDATE tasks SET notes=json_insert(COALESCE(notes,'[]'), '\$[#]', json('{\"content\":\"Commit: abc1234\",\"timestamp\":\"2026-06-02T00:00:00Z\"}')), updated_at=datetime('now') WHERE id=$ID AND project='$PROJECT'"

# plan_review_comments의 마지막 항목 comment 읽기 (critic_feedback)
sqlite3 -json "$DB" "SELECT json_extract(plan_review_comments, '\$[#-1].comment') as comment FROM tasks WHERE id=$ID AND project='$PROJECT'"

# review_comments의 마지막 항목 comment 읽기 (inspector_feedback)
sqlite3 -json "$DB" "SELECT json_extract(review_comments, '\$[#-1].comment') as comment FROM tasks WHERE id=$ID AND project='$PROJECT'"
```

### JSON Safety (사용자 입력 처리)

사용자 제공 텍스트(제목, 설명 등)를 삽입할 때는 Python sqlite3 모듈로 파라미터 바인딩을 사용한다:

```bash
python3 - <<PY
import sqlite3 as sq
conn = sq.connect("$DB")
cur = conn.execute("""
  INSERT INTO tasks (project, title, description, priority, level, status, tags)
  VALUES (?, ?, ?, ?, ?, 'todo', '[]')
""", ("$PROJECT", title_var, description_var, priority_var, level_var))
task_id = cur.lastrowid
conn.commit()
conn.close()
print(task_id)
PY
```

모델이 생성한 내용(plan, implementation_notes 등)은 직접 sqlite3 CLI로 업데이트해도 무방하나, 텍스트에 줄바꿈이나 단따옴표가 포함될 경우 Python을 사용한다:

```bash
python3 - <<PY
import sqlite3 as sq
conn = sq.connect("$DB")
conn.execute(
    "UPDATE tasks SET plan=?, updated_at=datetime('now') WHERE id=? AND project=?",
    (plan_content, task_id, project)
)
conn.commit()
conn.close()
PY
```

### 프로젝트 메타데이터 (projects 테이블)

```bash
# 현재 프로젝트 정보 조회
sqlite3 -json "$DB" "SELECT * FROM projects WHERE id='$PROJECT'"

# 프로젝트 등록/업데이트
sqlite3 "$DB" "INSERT OR REPLACE INTO projects (id, name, purpose, stack, brief, status, category, repo_url) VALUES ('$PROJECT', '$NAME', '$PURPOSE', '$STACK', '$BRIEF', 'active', '$CATEGORY', '$REPO_URL')"

# brief만 업데이트
sqlite3 "$DB" "UPDATE projects SET brief='...' WHERE id='$PROJECT'"

# 모든 프로젝트 조회
sqlite3 -json "$DB" "SELECT id, name, purpose, status, category FROM projects ORDER BY status, name"
```

### 태스크 생성 ID 읽기

```bash
TASK_ID=$(sqlite3 "$DB" "INSERT INTO tasks (project, title, description, priority, level, status, tags) VALUES ('$PROJECT', '$TITLE', '$DESC', '$PRIORITY', $LEVEL, 'todo', '[]') RETURNING id")
```

또는 Python을 통해 안전하게:

```bash
TASK_ID=$(python3 - <<PY
import sqlite3 as sq
conn = sq.connect("$DB")
cur = conn.execute("INSERT INTO tasks (project, title, priority, level, status, tags) VALUES (?, ?, ?, ?, 'todo', '[]')", ("$PROJECT", "$TITLE", "$PRIORITY", $LEVEL))
print(cur.lastrowid)
conn.commit()
conn.close()
PY
)
```

## 보드 JSON 구조 (Python 처리용)

`sqlite3 -json`의 출력은 flat list이다. Python에서 column별로 그룹화:

```python
import json, sys

rows = json.loads(board_json)  # sqlite3 -json 출력
board = {}
for row in rows:
    col = row['status']
    board.setdefault(col, []).append(row)

columns = ['todo', 'plan', 'plan_review', 'impl', 'impl_review', 'test', 'done']
# 이후 board.get('todo', []) 등으로 접근
```

## Error Handling

- **DB 파일 없음**: `/kanban-init` 실행 여부 확인. `$DB` 경로에 파일 존재 여부 확인.
- **sqlite3 없음**: `apt install sqlite3` 또는 동등한 명령으로 설치.
- **Agent failure**: 1 retry on first failure; 2nd failure → keep status, log to `agent_log`, notify user
- **Plan review loop**: `plan_review_count > 3` → circuit breaker, ask user
- **Impl review loop**: `impl_review_count > 3` → circuit breaker, ask user
- **Mid-pipeline crash**: preserve current status, log to `agent_log`, notify user
- In `--auto` mode: circuit breaker still fires, requires user intervention

## Agent Context Flow (Card = Work Record)

Each agent **signs their output** with a header: `> **Nickname** \`model\` · timestamp`
The `agent_log` accumulates the full chronological history of all agents who touched the task.

The `model` value should be the resolved provider model from `models.json` (not a hardcoded provider name in the template).

| Nickname | Reads | Writes (signed) | Moves to |
|----------|-------|-----------------|----------|
| `Refiner` | `title`, `description` | `description` (rewrite) | stays `todo` |
| `Planner` | `description` | `plan`, `decision_log`, `done_when` | `plan_review` |
| `Critic` | `description`, `plan`, `decision_log`, `done_when` | `plan_review_comments` | `impl` or `plan` |
| `Builder` | `description`, `plan`, `done_when`, `plan_review_comments` | `implementation_notes` | (none) |
| `Shield` | `description`, `implementation_notes` | `implementation_notes` (append) | `impl_review` |
| `Inspector` | `description`, `plan`, `done_when`, `implementation_notes` | `review_comments` | `test` or `impl` |
| `Ranger` | `title`, `implementation_notes` | `test_results` | `done` or `impl` |
| All agents | — | append signed entry to `agent_log` | — |

## Task Dependencies

### Convention

To declare dependencies, write `Depends on: #ID` (or `Depends on: #ID1, #ID2`) on the **first non-blank line** of the task description.

Example:
```
Depends on: #2100, #2150
Add task dependency context injection to kanban-run...
```

### Parsing

Regex: `Depends on:\s*(#\d+(?:,\s*#\d+)*)`  (case-insensitive)

Extract each `#ID` number. If the line is absent or no IDs match, dependency list is empty.

### Fetching Dependency Data

For each dependency ID, fetch from SQLite:
```bash
sqlite3 -json "$DB" "SELECT id, title, status, decision_log, implementation_notes FROM tasks WHERE id=$DEP_ID AND project='$PROJECT'"
```

All fields are fetched once and cached. Per-agent filtering happens at context assembly time, not at fetch time.

### Per-Agent Injection Rules

| Agent | Fields Injected | Truncation |
|-------|----------------|------------|
| `Planner` | `decision_log` + `implementation_notes` | 500 chars each |
| `Builder` | `implementation_notes` | 500 chars |
| `Inspector` | `decision_log` | 300 chars |

Truncation format: first N chars + `...[truncated]` suffix when the field exceeds the limit.

### Context Format (per dependency)

```
### #<DEP_ID>: <title> [<status>]
[IN PROGRESS] ← only if status != done

**Decision Log:**
<decision_log truncated per agent rule>

**Implementation Notes:**
<implementation_notes truncated per agent rule>
```

Fields not applicable to the current agent are omitted entirely.

### Error Handling

- **Task not found (empty result)**: warn in orchestrator log, skip that dependency, continue pipeline
- **Dep task in progress** (status != `done`): prepend `[IN PROGRESS]` warning to that dep's context block
- **Circular dependency**: if current task ID appears in a dependency's `Depends on:` line, emit error and abort the pipeline
- **No dependencies**: `<dependencies_context>` resolves to empty string; no behavioral change

### Review Feedback Injection

These placeholders carry feedback from previous review cycles (re-runs):

| Placeholder | Source Field | When Populated |
|-------------|-------------|----------------|
| `<critic_feedback>` | `plan_review_comments` | Planner re-run: last entry's `comment` from the JSON array |
| `<inspector_feedback>` | `review_comments` | Builder re-run: last entry's `comment` from the JSON array |

If the source field is empty or null (first run), the placeholder resolves to empty string.

Read last entry:
```bash
CRITIC_FEEDBACK=$(sqlite3 "$DB" "SELECT json_extract(plan_review_comments, '\$[#-1].comment') FROM tasks WHERE id=$ID AND project='$PROJECT'")
INSPECTOR_FEEDBACK=$(sqlite3 "$DB" "SELECT json_extract(review_comments, '\$[#-1].comment') FROM tasks WHERE id=$ID AND project='$PROJECT'")
```
