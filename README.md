<h1 align="center">cyanluna.skills</h1>
<p align="center">
  AI-powered kanban pipeline for Claude Code — six autonomous agents, one board.
</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Claude_Code-skills-8A2BE2" alt="Claude Code Skills" />
  <img src="https://img.shields.io/badge/version-2.0.0-green" alt="v2.0.0" />
</p>

---

<table>
<tr>
<td width="50%"><img src="docs/screenshots/board-view.png" alt="Board View" /></td>
<td width="50%"><img src="docs/screenshots/card-detail.png" alt="Card Detail" /></td>
</tr>
<tr>
<td><em>7-column board with drag-and-drop</em></td>
<td><em>Card detail with lifecycle progress bar</em></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/list-view.png" alt="List View" /></td>
<td width="50%"><img src="docs/screenshots/search-filter.png" alt="Search & Filter" /></td>
</tr>
<tr>
<td><em>List view with inline editing</em></td>
<td><em>Search, sort, and filter across projects</em></td>
</tr>
</table>

---

## Quick Start

**1. Clone and install skills**

```bash
git clone https://github.com/cyanluna/cyanluna.skills.git
cp -R cyanluna.skills/kanban      ~/.claude/skills/
cp -R cyanluna.skills/kanban-init ~/.claude/skills/
```

**2. Initialize a project** (inside any project directory)

```
/kanban-init
```

This creates `.claude/kanban.json`, a per-project SQLite DB at `~/.claude/kanban-dbs/{project}.db`, and a `kanban-board/start.sh` launcher.

**3. Start the board and add tasks**

```bash
./kanban-board/start.sh        # opens http://localhost:5173
```

```
/kanban add Implement user authentication
/kanban run 1                  # runs the full AI pipeline
```

---

## The Pipeline

Every task flows through a 7-column board. AI agents handle each stage automatically.

```
Req → Plan → Review Plan → Impl → Review Impl → Test → Done
```

| Column | Agent | Model | What happens |
|--------|-------|-------|--------------|
| **Requirements** | User | — | You describe what needs to be done |
| **Plan** | `Planner` | opus | Reads requirements, writes implementation plan |
| **Review Plan** | `Critic` | sonnet | Reviews the plan, approves or requests changes |
| **Implement** | `Builder` + `Shield` | opus + sonnet | Builder implements; Shield writes TDD tests |
| **Review Impl** | `Inspector` | sonnet | Code review with approve/reject |
| **Test** | `Ranger` | sonnet | Runs lint, build, and test suite |
| **Done** | — | — | Auto-commits with `[kanban #ID]` tag |

### Pipeline Levels

Not every task needs the full pipeline. Set the level at creation time:

| Level | Path | Use Case |
|-------|------|----------|
| **L1 Quick** | Req → Impl → Done | File cleanup, config changes, typo fixes |
| **L2 Standard** | Req → Plan → Impl → Review → Done | Feature edits, bug fixes, refactoring |
| **L3 Full** | Req → Plan → Plan Rev → Impl → Impl Rev → Test → Done | New features, architecture changes |

---

## The AI Team

Each agent has a fixed **nickname** used as a signature in every field and log entry. The task card becomes a complete work record — you can always see who wrote what and when.

| Nickname | Role | Model | Reads | Writes |
|----------|------|-------|-------|--------|
| `Planner` | Plan Agent | opus | description | plan |
| `Critic` | Plan Review | sonnet | description, plan | plan_review_comments |
| `Builder` | Worker | opus | description, plan, review comments | implementation_notes |
| `Shield` | TDD Tester | sonnet | description, implementation_notes | implementation_notes (append) |
| `Inspector` | Code Review | sonnet | description, plan, implementation_notes | review_comments |
| `Ranger` | Test Runner | sonnet | implementation_notes | test_results |

**Signature rule** — every agent prepends a header to its output:

```
> **Planner** `opus` · 2026-02-24T10:00:00Z
```

---

## Web Board Features

- **7-column kanban** with real-time task counts
- **Drag-and-drop** between columns (enforces valid status transitions)
- **Card detail modal** with lifecycle progress bar, editable requirements, level selector
- **List view** with inline status/level/priority editing
- **Search** by title, description, tags, or `#ID`
- **Sort** by creation date, completion date, or default rank
- **Hide old Done** toggle (3d+ threshold)
- **Multi-project** support — all projects on one board, or filter by project
- **Notes** with markdown support
- **Image attachments** with drag-and-drop upload
- **Markdown rendering** in plan, implementation notes, and reviews
- **Mermaid diagrams** rendered inline
- **Agent log viewer** — full chronological history of all agents per task
- **10s auto-refresh** (pauses when modal is open or dragging)
- **Dark theme** by default

---

## Commands Reference

<details>
<summary><strong>Click to expand all commands</strong></summary>

### `/kanban` or `/kanban list`

View the board as a markdown table. Fetches from the web API or falls back to direct SQLite.

### `/kanban context`

**Run first when starting a new session.** Fetches the board and outputs pipeline state:
in-progress tasks, pending reviews, recently completed, and next todos.

### `/kanban add <title>`

Create a new task. Prompts for priority, level (L1/L2/L3), description, and tags.

### `/kanban run <ID> [--auto]`

Run the full pipeline for a task. Default mode pauses for user confirmation at review stages.
`--auto` mode runs fully automatically (circuit breaker still fires at 3+ review loops).

### `/kanban step <ID>`

Execute only the **next** pipeline step, then exit.

### `/kanban move <ID> <status>`

Manually move a task to a different column. The API enforces valid transitions.

### `/kanban review <ID>`

Trigger code review for a task in `impl_review` status.

### `/kanban edit <ID>`

Edit task fields interactively.

### `/kanban remove <ID>`

Delete a task.

### `/kanban stats`

Show task counts per column and overall completion rate.

</details>

---

## Architecture

```
~/.claude/
├── skills/
│   ├── kanban/              # Main skill (SKILL.md + schema + agent templates)
│   │   ├── SKILL.md
│   │   ├── schema.md
│   │   └── templates/       # Agent prompt templates
│   │       ├── plan-agent.md
│   │       ├── review-agent.md
│   │       ├── worker-agent.md
│   │       ├── tdd-tester.md
│   │       ├── code-review-agent.md
│   │       └── test-runner.md
│   └── kanban-init/         # Project registration skill
│       ├── SKILL.md
│       └── onedrive-setup.md
├── kanban-board/            # Central web board (Vite + TypeScript)
│   └── ...
└── kanban-dbs/              # Per-project SQLite databases
    ├── my-project.db
    ├── another-project.db
    └── ...

<project>/
├── .claude/kanban.json      # Project config {"project": "my-project"}
└── kanban-board/start.sh    # Launcher script
```

Each project gets its own `.db` file — no WAL conflicts when working on multiple projects simultaneously.

---

## Cross-PC Sync

Symlink `~/.claude/kanban-dbs/` to a OneDrive folder for cross-PC sync (macOS + WSL):

```
macOS  ~/.claude/kanban-dbs → ~/Library/CloudStorage/OneDrive-Personal/dev/ai-kanban/dbs/
WSL    ~/.claude/kanban-dbs → /mnt/c/Users/{user}/OneDrive/dev/ai-kanban/dbs/
```

Different physical paths, same OneDrive folder. See [`kanban-init/onedrive-setup.md`](kanban-init/onedrive-setup.md) for full setup instructions.

---

## Other Skills

This repo also includes utility skills:

| Skill | Description |
|-------|-------------|
| **model-router** | Routes Task tool subagents to optimal Claude model (Haiku/Sonnet/Opus) based on task complexity |
| **gemini-claude-loop** | Dual-AI engineering loop — Claude plans and implements, Gemini validates and reviews |

Install: `cp -R <skill-folder> ~/.claude/skills/`

---

## License

MIT
