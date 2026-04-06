# Worklog Sync — API & Mapping Reference

## EOB API Endpoints

Base URL: `https://eob.10.182.252.32.sslip.io`

All endpoints (except login) require: `Authorization: Bearer <access_token>`

| Purpose | Method | Endpoint |
|---------|--------|----------|
| Login | POST | `/api/auth/login` (form: username, password) |
| Refresh token | POST | `/api/auth/refresh` (json: refresh_token) |
| Current user | GET | `/api/auth/me` |
| List worklogs | GET | `/api/worklogs?user_id=&start_date=&end_date=` |
| Create worklog | POST | `/api/worklogs` |
| Update worklog | PUT | `/api/worklogs/{id}` |
| Delete worklog | DELETE | `/api/worklogs/{id}` |
| Daily summary | GET | `/api/worklogs/summary/daily?user_id=&date=` |
| Frequent items | GET | `/api/worklogs/frequent?limit=&days=` |
| Project hierarchy | GET | `/api/projects/hierarchy` |
| Work type tree | GET | `/api/work-types/tree` |

## Kanban API Endpoints

Base URL: `http://localhost:5173`

| Purpose | Method | Endpoint |
|---------|--------|----------|
| Board (all projects) | GET | `/api/board` |
| Board (filtered) | GET | `/api/board?project=xxx` |
| All project settings | GET | `/api/project-settings` |
| Get project settings | GET | `/api/project-settings/:project` |
| Upsert project settings | PUT | `/api/project-settings/:project` |
| Get single task | GET | `/api/task/:id?project=xxx` |

## Worklog Create Payload

```json
{
  "date": "2026-04-01",
  "user_id": "uuid-string",
  "project_id": "uuid-string-or-null",
  "product_line_id": "string-or-null",
  "work_type_category_id": 42,
  "hours": 1.5,
  "description": "#42 인증 모듈 구현 완료"
}
```

Required: `date`, `user_id`, `work_type_category_id`, `hours`

## Timestamp-Based Hours Estimation

### Task Lifecycle Timestamps

```
created_at ─┐
             ├─ (user writes requirements)
started_at ─┤  ← moved to plan
             ├─ planning phase
planned_at ─┤  ← moved to plan_review
             ├─ review + iteration
             ├─ implementation phase
reviewed_at ┤  ← (if tracked via agent_log)
             ├─ testing phase
tested_at ──┤  ← moved to test
             ├─ final validation
completed_at┘  ← moved to done
```

### Calculation Rules

1. **Phase duration** = next_timestamp - current_timestamp
2. **Cap** at 8h per day (assume standard workday)
3. **Multi-day tasks**: distribute evenly across weekdays (Mon-Fri) in range
4. **Minimum**: 0.5h per logged entry
5. **Round** to nearest 0.5h
6. **agent_log parsing**: for granular breakdown, parse agent_log JSON array timestamps
   ```python
   # agent_log entry format
   [{"agent": "Builder", "timestamp": "2026-04-01T10:30:00Z", "action": "started"}, ...]
   ```

### Description Format

Simple, concise — what was done:

| Status | Format | Example |
|--------|--------|---------|
| done | `#{id} {title} 완료` | `#42 인증 모듈 구현 완료` |
| impl/test | `#{id} {title} 진행 중` | `#45 API 검증 진행 중` |
| impl_review | `#{id} {title} 코드리뷰 완료` | `#50 리팩토링 코드리뷰 완료` |
| plan | `#{id} {title} 설계 진행 중` | `#55 아키텍처 설계 진행 중` |

## Work Type Hierarchy (L1 → L2)

### ENG — Engineering
| Code | Name |
|------|------|
| ENG-SW | Software Development |
| ENG-SW-COD | Implementation (Coding) |
| ENG-SW-REQ | Requirements Analysis |
| ENG-SW-TST | Unit Testing |
| ENG-SW-DBG | Debugging |
| ENG-DES | Design & Development |

### MTG — Meeting & Collaboration
| Code | Name |
|------|------|
| MTG-INT | Internal Meeting |
| MTG-EXT | Customer/Vendor Meeting |
| MTG-UPD | Periodic Updates |
| MTG-FDB | Feedback |

### PRJ — Project Execution
| Code | Name |
|------|------|
| PRJ-REV | Review & Approval |
| PRJ-PLN | Planning & Scheduling |

### QMS — Quality & Compliance
| Code | Name |
|------|------|
| QMS-QC | Quality Control |

### SUP — Support & Service
| Code | Name |
|------|------|
| SUP-TKT | Ticket/Issue Resolution |

## Kanban Status → Default Work Type

| Kanban Status | Work Type Code | Rationale |
|--------------|---------------|-----------|
| `plan` | `ENG-SW-REQ` | Requirements/planning |
| `plan_review` | `PRJ-REV` | Plan review |
| `impl` | `ENG-SW` | Active development |
| `impl_review` | `PRJ-REV` | Code review |
| `test` | `ENG-SW-TST` | Testing |
| `done` | (use project default) | Completed |
