---
name: kanban-init
description: Scaffold the Kanban Board web viewer (Vite + TypeScript) in the current project. Creates kanban-board/ directory with 4-column board, drag-and-drop, card lifecycle modal, and auto-refresh. Run with /kanban-init.
license: MIT
---

Scaffolds a `kanban-board/` directory in the current project root with a Vite-based web board that reads from `.claude/kanban.db`.

## Prerequisites

- The `/kanban` skill must be installed (`~/.claude/skills/kanban/SKILL.md`)
- `pnpm` must be available
- Node.js 18+

## Template Files

All source files are stored alongside this skill at:

```
~/.claude/skills/kanban-init/templates/
  package.json
  tsconfig.json
  vite.config.ts
  index.html
  plugins/kanban-api.ts
  src/main.ts
  src/style.css
```

## Procedure

1. Check if `kanban-board/` already exists in the project root. If it does, ask the user whether to overwrite or abort.
2. Read each template file from `~/.claude/skills/kanban-init/templates/` using the Read tool, then write it to the corresponding path under `kanban-board/` using the Write tool.

   | Template Source | Write Destination |
   |---|---|
   | `templates/package.json` | `kanban-board/package.json` |
   | `templates/tsconfig.json` | `kanban-board/tsconfig.json` |
   | `templates/vite.config.ts` | `kanban-board/vite.config.ts` |
   | `templates/index.html` | `kanban-board/index.html` |
   | `templates/plugins/kanban-api.ts` | `kanban-board/plugins/kanban-api.ts` |
   | `templates/src/main.ts` | `kanban-board/src/main.ts` |
   | `templates/src/style.css` | `kanban-board/src/style.css` |

3. Run `cd kanban-board && pnpm install`.
4. Output instructions to the user:
   ```
   Kanban Board installed. To start:
     cd kanban-board && pnpm dev
   Default port: 5173 (auto-increments if in use)
   ```

## Port Configuration

The dev server starts at port **5173** by default. If the port is already in use, Vite automatically tries the next available port (5174, 5175, ...). This is controlled by `strictPort: false` in `vite.config.ts`.

## .gitignore Recommendation

After scaffolding, suggest adding to the project's `.gitignore`:
```
.claude/kanban.db
.claude/kanban.db-wal
.claude/kanban.db-shm
```
