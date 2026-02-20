# cyanluna.skills

Custom Claude Code skills for personal development workflow.

## Skills

### kanban
Manage project tasks in a local SQLite DB (`.claude/kanban.db`). Supports session context persistence, task CRUD, lifecycle documentation, and automated code review.

**Usage**: `/kanban`, `/kanban add`, `/kanban move`, `/kanban review`, `/kanban context`

### kanban-init
Scaffold the Kanban Board web viewer (Vite + TypeScript) in the current project. Creates `kanban-board/` directory with 4-column board, drag-and-drop, card lifecycle modal, and 10s auto-refresh.

**Usage**: `/kanban-init`

### model-router
Intelligently route tasks to appropriate Claude model (Haiku/Sonnet/Opus) based on complexity. Pattern-based task classification with automatic model selection.

### gemini-claude-loop
Orchestrates a dual-AI engineering loop where Claude plans and implements, while Gemini validates and reviews, with continuous feedback for optimal code quality.

## Installation

Copy the desired skill folder to `~/.claude/skills/`:

```bash
cp -R kanban ~/.claude/skills/
cp -R kanban-init ~/.claude/skills/
cp -R model-router ~/.claude/skills/
cp -R gemini-claude-loop ~/.claude/skills/
```

## License

MIT
