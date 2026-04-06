---
name: worklog-sync
description: Sync kanban board tasks to EOB weekly worklogs. Reads completed/in-progress kanban cards, maps them to worklog projects, estimates hours from timestamps, aggregates by day, and submits via the EOB API.
license: MIT
---

## Overview

Reads kanban board tasks and creates weekly worklog entries in the Engineering Operation Board (EOB).
Tasks are aggregated by date + project + work type into one worklog card per group.

## Project Classification

Each kanban project has a `worklog_type`:

| type | 동작 |
|------|------|
| `work` | EOB 프로젝트에 매핑, `project_id` 포함하여 워크로그 생성 |
| `non-project` | `project_id` 없이 워크로그 생성 (업무유형만 지정) |
| `personal` | 워크로그에서 제외 (동기화 스킵) |

### Project Settings Storage

**Primary**: Kanban DB `project_settings` table (via `PUT /api/project-settings/:project`)
**Fallback**: `~/.claude/worklog-sync.json` → `project_map` (only if the deployed API has not been updated yet)

```sql
-- Kanban DB table (auto-created on connection)
CREATE TABLE IF NOT EXISTS project_settings (
  project TEXT PRIMARY KEY,
  worklog_type TEXT NOT NULL DEFAULT 'work',
  eob_project_id TEXT,
  eob_product_line_id TEXT,
  default_work_type_code TEXT DEFAULT 'ENG-SW',
  label TEXT
);
```

### Kanban API for project_settings

```bash
KANBAN_API="$BASE_URL"  # from kanban config

# List all
curl -s "${AUTH_HEADER[@]}" "$KANBAN_API/api/project-settings"

# Get one
curl -s "${AUTH_HEADER[@]}" "$KANBAN_API/api/project-settings/$PROJECT"

# Upsert
curl -s "${AUTH_HEADER[@]}" -X PUT "$KANBAN_API/api/project-settings/$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"worklog_type":"work","eob_project_id":"<UUID>","default_work_type_code":"ENG-SW","label":"..."}'
```

If the API returns 404, fall back to `project_map` in config file. Do not read any local DB directly.

## Configuration

`~/.claude/worklog-sync.json`:

```json
{
  "eob_base_url": "https://eob.10.182.252.32.sslip.io",
  "kanban_api": "https://cyanlunakanban.vercel.app",
  "kanban_auth_token": "<X-Kanban-Auth token>",
  "access_token": null,
  "refresh_token": null,
  "user_id": null,
  "project_map": {
    "edwards.oqc.infra": { "worklog_type": "work", "eob_project_id": "ac78d5ae-a15e-4a40-9638-8109539d6633", "default_work_type_code": "ENG-SW", "label": "OQC Digitalization Infrastructure" },
    "unify": { "worklog_type": "work", "eob_project_id": "013c7ee7-edcc-46bc-bcc8-55b15bb2481f", "default_work_type_code": "ENG-SW", "label": "Unify Plasma Single" },
    "edwards.operation.board": { "worklog_type": "non-project", "default_work_type_code": "ENG-SW", "label": "Team DX / Productivity" },
    "testrig-dashboard": { "worklog_type": "non-project", "default_work_type_code": "ENG-SW", "label": "Team Work" },
    "3dx.api": { "worklog_type": "non-project", "default_work_type_code": "ENG-SW", "label": "3DX API (Team Work)" },
    "cpet.db": { "worklog_type": "personal" },
    "cpet": { "worklog_type": "personal" },
    "ai.cycling.workout.planner": { "worklog_type": "personal" },
    "ai-cycling-coach": { "worklog_type": "personal" },
    "unahouse.finance": { "worklog_type": "personal" },
    "today.bike": { "worklog_type": "personal" },
    "asan.bicycle": { "worklog_type": "personal" },
    "cyanluna-portfolio": { "worklog_type": "personal" },
    "cyanluna.skills": { "worklog_type": "personal" },
    "bangwahu": { "worklog_type": "personal" },
    "remotion-video-gen": { "worklog_type": "personal" },
    "type1recovery": { "worklog_type": "personal" },
    "kanban-board": { "worklog_type": "personal" }
  }
}
```

## Commands

### `/worklog-sync login` — Authenticate with EOB

1. Ask user for email and password via AskUserQuestion.

2. Authenticate:
```bash
EOB="https://eob.10.182.252.32.sslip.io"
AUTH=$(curl -s -X POST "$EOB/api/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$EMAIL&password=$PASSWORD")
```

3. Extract tokens and get user info:
```bash
TOKEN=$(echo "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
REFRESH=$(echo "$AUTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])")

ME=$(curl -s "$EOB/api/auth/me" -H "Authorization: Bearer $TOKEN")
USER_ID=$(echo "$ME" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
```

4. Save to `~/.claude/worklog-sync.json`.

### `/worklog-sync map` — Configure Project Mapping

1. Fetch all kanban projects and their current settings:
```bash
BOARD=$(curl -s "${AUTH_HEADER[@]}" "$KANBAN_API/api/board")
# board.projects = ["project-a", "project-b", ...]
# board.project_settings = { "project-a": {...}, ... }
```

2. Fetch EOB project hierarchy for matching:
```bash
PROJECTS=$(curl -s "$EOB/api/projects/hierarchy" -H "Authorization: Bearer $TOKEN")
```

3. For each kanban project without settings, ask user via AskUserQuestion:
   - worklog_type: `work` / `non-project` / `personal`
   - If `work`: select EOB project from hierarchy
   - Default work type code

4. Save via API:
```bash
curl -s "${AUTH_HEADER[@]}" -X PUT "$KANBAN_API/api/project-settings/$PROJECT" \
  -H 'Content-Type: application/json' \
  -d '{"worklog_type": "work", "eob_project_id": "...", "label": "..."}'
```

### `/worklog-sync` — Main Sync Flow

**Procedure:**

1. **Load auth & refresh token if needed**
```bash
CONFIG=$(cat ~/.claude/worklog-sync.json)
EOB=...  TOKEN=...  REFRESH=...  USER_ID=...
```
   If token expired, try refresh → if refresh fails, prompt `/worklog-sync login`.

2. **Determine target week** (default: current week Mon–Sun)
```bash
TODAY=$(date +%Y-%m-%d)
DOW=$(date -d "$TODAY" +%u)
MONDAY=$(date -d "$TODAY -$((DOW-1)) days" +%Y-%m-%d)
SUNDAY=$(date -d "$MONDAY +6 days" +%Y-%m-%d)
```

3. **Fetch kanban board**
```bash
KANBAN_API=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('kanban_api','https://cyanlunakanban.vercel.app'))")
KANBAN_TOKEN=$(echo "$CONFIG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('kanban_auth_token',''))")
BOARD=$(curl -s -H "X-Kanban-Auth: $KANBAN_TOKEN" "$KANBAN_API/api/board")
```
   - Load project mappings: try `board.project_settings` first, fall back to `config.project_map`
   - Filter out projects where `worklog_type == "personal"` → skip entirely
   - Projects not in any mapping → flag as "UNMAPPED" in preview, ask user to classify

4. **Collect tasks relevant for the week**
   - Status `done` with `completed_at` within the target week
   - Status `impl`, `impl_review`, `test`, `plan`, `plan_review` with timestamps within the week

5. **Estimate hours from timestamps**

   Use task lifecycle timestamps to calculate actual work time per day:

   ```
   started_at → planned_at    = planning work
   planned_at → reviewed_at   = review + iteration
   reviewed_at → tested_at    = implementation time
   tested_at → completed_at   = testing time
   started_at → completed_at  = total elapsed (fallback)
   ```

   **Rules:**
   - Calculate elapsed time between phase timestamps
   - Cap at **8h per day** per task (workday assumption)
   - If elapsed > 1 day, distribute hours across work days (Mon–Fri) within the range
   - Minimum: **0.5h** per task phase
   - Round to nearest **0.5h**
   - `agent_log` timestamps can be used for more granular per-day breakdown

   **Example:**
   - Task #42: `started_at=04/01 09:00`, `completed_at=04/02 15:00`
   - Elapsed: ~1.25 work days → 04/01: 4h, 04/02: 4h (distribute evenly)

6. **Fetch existing worklogs** (duplicate check)
```bash
EXISTING=$(curl -s "$EOB/api/worklogs?user_id=$USER_ID&start_date=$MONDAY&end_date=$SUNDAY" \
  -H "Authorization: Bearer $TOKEN")
```
   Skip if same date + project + similar description already exists.

7. **Fetch work type tree** (resolve codes to IDs)
```bash
WORK_TYPES=$(curl -s "$EOB/api/work-types/tree" -H "Authorization: Bearer $TOKEN")
```

8. **Aggregate into daily worklog cards**

   **Core rule: same date + same project + same work_type → one worklog card.**

   Group all task entries by `(date, project, work_type_code)`, then:
   - **hours**: Sum of all tasks in the group (cap at 8h per card)
   - **project_id**: From `project_settings.eob_project_id`
   - **work_type_category_id**: Resolve code from work type tree
   - **description**: Brief list of what was done inside the card

   **Description format** — concise activity log, not individual task dumps:
   ```
   인증 모듈 구현 완료, API 검증 수정, 사이드바 정렬 개선
   ```
   - Each item: short summary (task title condensed to ~15 chars) + 완료/진행 중
   - Comma-separated, one line
   - If too many items (>5), summarize: `SW 개발 7건 (인증 모듈, API 검증 외 5건)`

   **Daily cap**: If a single card exceeds 8h, cap at 8h. Remaining hours are dropped (user can adjust in preview).

   **Example aggregation:**
   ```
   Raw tasks for 02/27, OQC Digitalization, ENG-SW:
     #37 run.sh 실행 모드 개선 (0.5h)
     #40 SemiAutoTaskForm (0.5h)
     #41 TaskSchema parser (0.5h)
     #42 Edge Runner timeout (0.5h)
     #44 Gherkin DB 마이그레이션 (0.5h)

   → Aggregated card:
     date: 2026-02-27
     project: OQC Digitalization Infrastructure
     work_type: ENG-SW
     hours: 2.5h
     description: "run.sh 실행모드 개선, SemiAutoTaskForm, TaskSchema parser, Edge Runner timeout, Gherkin DB 마이그레이션 완료"
   ```

9. **Preview to user**
```
## Worklog Preview: 2026-02-24 ~ 2026-03-01

| Date  | Project              | Type        | Hours | Description                                        |
|-------|----------------------|-------------|-------|----------------------------------------------------|
| 02/24 | OQC Digitalization   | ENG-SW      | 1.0h  | DB 도메인 분리 완료                                 |
| 02/24 | Unify Plasma Single  | ENG-SW      | 5.5h  | SQL 통합관리, db-viewer 제거, config manager 생성 외 |
| 02/25 | OQC Digitalization   | ENG-SW      | 2.0h  | FT&CC 카탈로그, Inspection 선택, 자동화 배지 외     |
| 02/25 | OQC Digitalization   | ENG-SW-TST  | 0.5h  | Auto task form 테스트                               |
| 02/27 | OQC Digitalization   | ENG-SW      | 8.0h  | Gherkin Pattern A, Corrective 탭, run.sh 개선 외    |
| 02/27 | Unify Plasma Single  | ENG-SW      | 8.0h  | Config Manager 통합, Metadata Viewer 외             |

**Total: 35h / 12 cards** (personal 3건 제외)

Proceed? (Enter to confirm, or edit)
```

10. **User adjusts** via AskUserQuestion if needed (hours, project, work type, date, remove).

11. **Submit approved entries**
```bash
curl -s -X POST "$EOB/api/worklogs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"$DATE\",
    \"user_id\": \"$USER_ID\",
    \"project_id\": \"$PROJECT_ID\",
    \"work_type_category_id\": $WTC_ID,
    \"hours\": $HOURS,
    \"description\": \"$DESCRIPTION\"
  }"
```

12. **Report results**
```
## Sync Complete
Created 3 entries (9h) for 2026-03-30 ~ 2026-04-05. Failed: 0
```

### `/worklog-sync status` — Weekly Summary

1. Load auth, fetch current week's worklogs:
```bash
curl -s "$EOB/api/worklogs?user_id=$USER_ID&start_date=$MONDAY&end_date=$SUNDAY" \
  -H "Authorization: Bearer $TOKEN"
```
2. Display:
```
## Week: 2026-03-30 ~ 2026-04-05

| Day | Hours | Entries |
|-----|-------|---------|
| Mon 03/30 | 3.75h | 5 |
| Tue 03/31 | 4.0h | 5 |
| Wed 04/01 | 8.0h | 3 |
| Thu 04/02 | 4.5h | 8 |
| Fri 04/03 | 2.5h | 3 |
| **Total** | **22.75h / 40h** | **24** |
```

## Work Type Quick Reference

| Code | Name | When to Use |
|------|------|-------------|
| `ENG-SW` | Software Development | Default for kanban coding tasks |
| `ENG-SW-COD` | Implementation (Coding) | Specific coding work |
| `ENG-SW-REQ` | Requirements Analysis | Planning/requirements tasks |
| `ENG-SW-TST` | Unit Testing | Test writing |
| `ENG-SW-DBG` | Debugging | Bug fixes |
| `PRJ-REV` | Review & Approval | Code review tasks |
| `PRJ-PLN` | Planning & Scheduling | Sprint planning |
| `MTG-INT` | Internal Meeting | Team meetings |
| `QMS-QC` | Quality Control | QC-related tasks |
| `SUP-TKT` | Ticket/Issue Resolution | Support tickets |

## Task-to-WorkType Inference Rules

When `default_work_type_code` doesn't cover it, infer from task content:

1. Title contains "review", "approve" → `PRJ-REV`
2. Title contains "fix", "bug", "debug" → `ENG-SW-DBG`
3. Title contains "test" → `ENG-SW-TST`
4. Title contains "meeting", "sync", "standup" → `MTG-INT`
5. Tags contain "qc", "quality" → `QMS-QC`
6. **Default fallback**: project's `default_work_type_code`

## Notes

- **24h daily limit**: EOB API rejects worklogs if total hours for a day exceed 24.
- **Duplicate prevention**: Checks existing worklogs before creating.
- **Token expiry**: Access tokens expire in 30 min; auto-refreshes via refresh token (7 days).
- **Kanban API fallback**: Do not query any local DB directly. Use the deployed Kanban API, or fall back only to `project_map` for classification metadata.
