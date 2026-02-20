---
name: kanban
description: Manage project tasks in a local SQLite DB (.claude/kanban.db). Supports session context persistence, task CRUD, lifecycle documentation, and automated code review. Run with /kanban.
license: MIT
---

Manages project tasks in a project-local `.claude/kanban.db` SQLite database.
The DB lives inside the project directory, so it travels with the project and can be version-controlled.

## DB Path

```
{project_root}/.claude/kanban.db
```

Auto-creates the `.claude/` directory and DB file if missing.

## Table Schema

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
  tags TEXT,
  review_comments TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  started_at TEXT,
  reviewed_at TEXT,
  completed_at TEXT
);
```

| Column | Type | Description |
|--------|------|-------------|
| `project` | TEXT | Project identifier. Uses `basename "$(pwd)"` |
| `status` | TEXT | `todo` / `inprogress` / `review` / `done` |
| `priority` | TEXT | `high` / `medium` / `low` |
| `description` | TEXT | **Requirements** in markdown - what needs to be done |
| `plan` | TEXT | **Implementation plan** in markdown - how to do it |
| `implementation_notes` | TEXT | **Implementation log** in markdown - what was actually done |
| `tags` | TEXT | JSON array string (e.g., `'["api","ui","db"]'`) |
| `review_comments` | TEXT | JSON array of review comment objects (see format below) |

### Card Lifecycle (4 Phases)

Each card captures the full workflow. Clicking a card in the web board shows all phases in a modal:

```
Phase 1: Requirements  (description)           - What needs to be done
Phase 2: Plan          (plan)                   - How to approach it
Phase 3: Implementation (implementation_notes)  - What was actually changed
Phase 4: Review        (review_comments)        - Verification results
```

### review_comments Format

```json
[
  {
    "reviewer": "claude-review-agent",
    "status": "changes_requested",
    "comment": "## Review Findings\n\n1. **Error handling**: Missing try-catch\n2. **Types**: Avoid using any",
    "timestamp": "2026-02-20T14:30:00.000Z"
  },
  {
    "reviewer": "claude-review-agent",
    "status": "approved",
    "comment": "Fixes verified. Code quality is good.",
    "timestamp": "2026-02-20T15:00:00.000Z"
  }
]
```

## Project Name Detection

Uses the basename of the current working directory:
```bash
basename "$(pwd)"
```

## DB Path Resolution

```bash
DB_PATH="$(pwd)/.claude/kanban.db"
mkdir -p "$(pwd)/.claude"
```

## Commands

### View Board (Default)
`/kanban` or `/kanban list`

Run the query and output as a markdown table:
```bash
sqlite3 -header -column .claude/kanban.db \
  "SELECT id, title, status, priority FROM tasks WHERE project='PROJECT' ORDER BY CASE status WHEN 'inprogress' THEN 0 WHEN 'review' THEN 1 WHEN 'todo' THEN 2 WHEN 'done' THEN 3 END, id"
```

Output format:
```
### PROJECT Kanban Board

| ID | Status | Priority | Title |
|----|--------|----------|-------|
| 3  | In Progress | high | Category Rules UI |
| 7  | Review | medium | API Error Handling |
| 1  | To Do | medium | Monthly Budget |
| 10 | Done | - | Expense Flag |
```

### Context (Session Handoff)
`/kanban context`

**Run this first when starting a new session.** Shows in-progress + review + recent done + todo:
```bash
sqlite3 -header -column .claude/kanban.db "
  SELECT id, title, priority, description, plan, implementation_notes FROM tasks
  WHERE project='PROJECT' AND status='inprogress';
"
sqlite3 -header -column .claude/kanban.db "
  SELECT id, title, priority, review_comments FROM tasks
  WHERE project='PROJECT' AND status='review';
"
sqlite3 -header -column .claude/kanban.db "
  SELECT id, title, completed_at FROM tasks
  WHERE project='PROJECT' AND status='done'
  ORDER BY completed_at DESC LIMIT 3;
"
sqlite3 -header -column .claude/kanban.db "
  SELECT id, title, priority FROM tasks
  WHERE project='PROJECT' AND status='todo'
  ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END;
"
```

Output format:
```
### In Progress
- [#3] Category Rules UI (high)
  Requirements: ...
  Plan: ...

### Awaiting Review
- [#7] API Error Handling (medium)
  Latest review: changes_requested - "Need Korean locale support for error messages"

### Recently Done
- [#10] Expense Flag (2026-02-20)

### Next To Do
- [#1] Monthly Budget (medium)
```

### Add Task
`/kanban add <title>`

1. Ask the user for priority, description, and tags (use AskUserQuestion)
2. Run INSERT:
```bash
sqlite3 .claude/kanban.db "
  INSERT INTO tasks (project, title, priority, description, tags)
  VALUES ('PROJECT', 'title', 'priority', 'description', '[\"tag\"]');
"
```
3. Output confirmation with the new task ID

### Move Task
`/kanban move <ID> <status>`

```bash
# todo -> inprogress
sqlite3 .claude/kanban.db "
  UPDATE tasks SET status='inprogress', started_at=datetime('now')
  WHERE id=<ID>;
"

# inprogress -> review (implementation done, request review)
sqlite3 .claude/kanban.db "
  UPDATE tasks SET status='review', reviewed_at=NULL
  WHERE id=<ID>;
"

# review -> done (approved)
sqlite3 .claude/kanban.db "
  UPDATE tasks SET status='done', completed_at=datetime('now'), reviewed_at=datetime('now')
  WHERE id=<ID>;
"

# review -> inprogress (changes requested)
sqlite3 .claude/kanban.db "
  UPDATE tasks SET status='inprogress'
  WHERE id=<ID>;
"

# done -> todo (revert)
sqlite3 .claude/kanban.db "
  UPDATE tasks SET status='todo', started_at=NULL, completed_at=NULL, reviewed_at=NULL
  WHERE id=<ID>;
"
```

### Code Review
`/kanban review <ID>`

When a task is in `review` status, spawn a **Task sub-agent** to perform automated code review.

#### Review Procedure

1. Read the task's `description`, `plan`, and `implementation_notes` for context
2. Spawn a **Task sub-agent** (subagent_type: `general-purpose`) to perform the review
3. The review agent reads relevant code files and evaluates changes
4. Results are stored in `review_comments` as JSON
5. Status auto-transitions based on result:
   - `approved` -> moves to `done`
   - `changes_requested` -> moves back to `inprogress`

#### Sub-Agent Review Prompt Template

```
You are a code reviewer. Review Kanban task #<ID>.

## Task Info
- Title: <title>
- Requirements: <description>
- Plan: <plan>
- Implementation Notes: <implementation_notes>

## Review Checklist
1. **Code Quality**: Readability, duplication, function size, naming
2. **Error Handling**: Proper try-catch, error message quality
3. **Type Safety**: TypeScript types, minimize `any` usage
4. **Security**: SQL injection, XSS, input validation
5. **Performance**: Unnecessary queries, memory usage, N+1 problems

## How to Review
1. Read the relevant code files to understand changes
2. Evaluate against the checklist above
3. Record results using the sqlite3 command below

## Recording Results

If no issues (approve):
sqlite3 .claude/kanban.db "
  UPDATE tasks SET
    review_comments = json_insert(
      COALESCE(review_comments, '[]'),
      '$[#]',
      json_object(
        'reviewer', 'claude-review-agent',
        'status', 'approved',
        'comment', 'Approved. [specific reason]',
        'timestamp', datetime('now')
      )
    ),
    reviewed_at = datetime('now'),
    status = 'done',
    completed_at = datetime('now')
  WHERE id=<ID>;
"

If issues found (request changes):
sqlite3 .claude/kanban.db "
  UPDATE tasks SET
    review_comments = json_insert(
      COALESCE(review_comments, '[]'),
      '$[#]',
      json_object(
        'reviewer', 'claude-review-agent',
        'status', 'changes_requested',
        'comment', '## Changes Required\n\n[specific feedback]',
        'timestamp', datetime('now')
      )
    ),
    reviewed_at = datetime('now'),
    status = 'inprogress'
  WHERE id=<ID>;
"
```

#### Post-Review Re-implementation Flow

When `changes_requested`:
1. Card auto-moves to `inprogress`
2. Implementation agent runs `/kanban context` to read review comments
3. Fixes the issues, then `/kanban move <ID> review`
4. `/kanban review <ID>` triggers another review
5. Repeats until approved

### Edit Task
`/kanban edit <ID>`

Ask the user which fields to modify, then run UPDATE.

### Delete Task
`/kanban remove <ID>`

```bash
sqlite3 .claude/kanban.db "DELETE FROM tasks WHERE id=<ID>;"
```

### Stats
`/kanban stats`

```bash
sqlite3 -header -column .claude/kanban.db "
  SELECT status, COUNT(*) as count, GROUP_CONCAT(title, ', ') as titles
  FROM tasks WHERE project='PROJECT'
  GROUP BY status;
"
```

## Initial Setup

Auto-creates DB if missing:
```bash
mkdir -p .claude
sqlite3 .claude/kanban.db "
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
    created_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    reviewed_at TEXT,
    completed_at TEXT
  );
"
```

## .gitignore

Choose whether to track the DB in git:
```bash
# To exclude (personal use):
echo ".claude/kanban.db" >> .gitignore
echo ".claude/kanban.db-wal" >> .gitignore
echo ".claude/kanban.db-shm" >> .gitignore
```

## Agent Workflow (Lifecycle Documentation)

The implementation agent MUST record documentation at each phase. Summarize what you would normally output in chat as markdown and write it to the card.

### Step 1: Start Implementation

```bash
# Move to inprogress
sqlite3 .claude/kanban.db "UPDATE tasks SET status='inprogress', started_at=datetime('now') WHERE id=<ID>;"

# Record plan (after analyzing code, write implementation plan as markdown)
sqlite3 .claude/kanban.db "UPDATE tasks SET plan='## Implementation Plan

### Files to Modify
- src/lib/xxx.ts - Core logic changes
- src/app/api/xxx/route.ts - API endpoint

### Approach
1. First modify XXX
2. Then add YYY
3. Test' WHERE id=<ID>;"
```

### Step 2: Complete Implementation

```bash
# Record what was done (summarize actual changes as markdown)
sqlite3 .claude/kanban.db "UPDATE tasks SET implementation_notes='## Changes

### Modified Files
- **src/lib/xxx.ts**: Added XXX function, modified YYY logic
- **src/app/api/xxx/route.ts**: New endpoint

### Key Changes
- Implemented ZZZ feature
- Added error handling' WHERE id=<ID>;"

# Move to review
sqlite3 .claude/kanban.db "UPDATE tasks SET status='review', reviewed_at=NULL WHERE id=<ID>;"
```

### Step 3: Review
`/kanban review <ID>` to trigger automated code review

### Step 4: Review Result
- **Approved**: Auto-moves to `done`
- **Changes requested**: Auto-moves to `inprogress` -> fix -> move to `review` again

### Step 5: New Session
`/kanban context` to see full lifecycle (requirements, plan, implementation notes, review comments)

### Summary

| Phase | Field | Content | Written By |
|-------|-------|---------|------------|
| Requirements | `description` | What needs to be done | User / Planning |
| Plan | `plan` | How to approach it | Implementation agent |
| Implementation | `implementation_notes` | What was actually changed | Implementation agent |
| Review | `review_comments` | Verification results, feedback | Review agent |

## Web Board Viewer (Optional)

Run `/kanban-init` to scaffold the web board in any project. It creates a `kanban-board/` directory with all files.

```bash
cd kanban-board && pnpm dev
```
Default port: 5173 (auto-increments if in use). Open the 4-column board (To Do, In Progress, Review, Done) with drag-and-drop, card lifecycle modal, add card form, and 10s auto-refresh.
