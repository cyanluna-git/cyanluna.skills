<h1 align="center">cyanluna.skills</h1>
<p align="center">
  AI-powered kanban pipeline for Claude Code and Codex — seven autonomous agents, one board.
</p>
<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <img src="https://img.shields.io/badge/Claude_Code-skills-8A2BE2" alt="Claude Code Skills" />
  <img src="https://img.shields.io/badge/Codex-supported-10A37F" alt="Codex Supported" />
  <img src="https://img.shields.io/badge/version-3.1.0-green" alt="v3.1.0" />
  <img src="https://img.shields.io/badge/DB-Neon_PostgreSQL-00E599" alt="Neon PostgreSQL" />
  <img src="https://img.shields.io/badge/Storage-Cloudflare_R2-F38020" alt="Cloudflare R2" />
</p>

---

<p align="center">
  <a href="docs/demo.webm">
    <img src="docs/screenshots/board-view.png" alt="Demo Video" width="720" />
    <br/><em>Click to watch demo (25s)</em>
  </a>
</p>

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
REPO="$PWD/cyanluna.skills"

# Claude install
mkdir -p ~/.claude/skills
cp -R "$REPO"/kanban         ~/.claude/skills/
cp -R "$REPO"/kanban-run     ~/.claude/skills/
cp -R "$REPO"/kanban-refine  ~/.claude/skills/
cp -R "$REPO"/kanban-init    ~/.claude/skills/
cp -R "$REPO"/kanban-explore ~/.claude/skills/
cp -R "$REPO"/kanban-board   ~/.claude/kanban-board

# Codex install (recommended: symlink to shared source)
mkdir -p ~/.codex/skills
for s in kanban kanban-run kanban-refine kanban-init kanban-explore; do
  ln -sfn "$REPO/$s" "$HOME/.codex/skills/$s"
done
ln -sfn "$HOME/.claude/kanban-board" "$HOME/.codex/kanban-board"
```

**2. Set up environment**

```bash
cd ~/.codex/kanban-board 2>/dev/null || cd ~/.claude/kanban-board
cp .env.example .env   # fill in DATABASE_URL and optionally Cloudflare R2 vars
pnpm install
```

Create a free Neon database at [neon.tech](https://neon.tech) and paste the connection string as `DATABASE_URL`.
For image attachments, set up a [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket and fill in the `CLOUDFLARE_R2_*` variables. Image uploads are disabled if these are omitted.

**3. Initialize a project** (inside any project directory)

```
/kanban-init
```

This creates `.claude/kanban.json`, `.codex/kanban.json`, and a `kanban-board/start.sh` launcher.
Project data is stored in Neon under a `project` column — no local DB files needed.

**4. Start the board and add tasks**

```bash
./kanban-board/start.sh        # opens http://localhost:5173
```

```
/kanban add Implement user authentication
/kanban-run 1                  # runs the full AI pipeline
```

---

## The Pipeline

Every task flows through a 7-column board. AI agents handle each stage automatically.

```
Req → Plan → Review Plan → Impl → Review Impl → Test → Done
```

| Column | Agent | Model (Claude / Codex) | What happens |
|--------|-------|-------|--------------|
| **Requirements** | User | — | You describe what needs to be done |
| **Plan** | `Planner` | opus / gpt-5.2 | Reads requirements, writes plan + decision log + done-when checklist |
| **Review Plan** | `Critic` | sonnet / gpt-5.2 | Scores plan on 3 dimensions, approves or requests changes |
| **Implement** | `Builder` + `Shield` | opus+sonnet / gpt-5.3-codex | Builder implements; Shield writes TDD tests |
| **Review Impl** | `Inspector` | sonnet / gpt-5.2 | Scores code on 7 dimensions, approves or rejects |
| **Test** | `Ranger` | sonnet / gpt-5.3-codex | Runs lint, build, and test suite |
| **Done** | — | — | Auto-commits with `[kanban #ID]` tag |

Model routing is provider-aware via `kanban/models.json`.

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

| Nickname | Role | Model (Claude / Codex) | Reads | Writes |
|----------|------|-------|-------|--------|
| `Planner` | Plan Agent | opus / gpt-5.2 | description | plan, decision_log, done_when |
| `Critic` | Plan Review | sonnet / gpt-5.2 | description, plan, decision_log, done_when | plan_review_comments |
| `Builder` | Worker | opus / gpt-5.3-codex | description, plan, done_when, review comments | implementation_notes |
| `Shield` | TDD Tester | sonnet / gpt-5.3-codex | description, implementation_notes | implementation_notes (append) |
| `Inspector` | Code Review | sonnet / gpt-5.2 | description, plan, done_when, implementation_notes | review_comments |
| `Ranger` | Test Runner | sonnet / gpt-5.3-codex | implementation_notes | test_results |
| `Refiner` | Requirements Refinement | opus / gpt-5.2 | title, description | description (rewrite) |

**Signature rule** — every agent prepends a header to its output:

```
> **Planner** `opus` · 2026-02-24T10:00:00Z
```

### Scoring Rubrics

Review agents use structured scoring (1–5 per dimension) instead of plain approve/reject.

**Critic** scores plans on 3 dimensions:

| Dimension | What it measures |
|-----------|-----------------|
| Clarity | Is the plan unambiguous and actionable? |
| Done-When Quality | Are completion criteria verifiable? |
| Reversibility | Can changes be safely rolled back? |

Average >= 4.0 → approved. Any score = 1 or average < 3.0 → changes requested.

**Inspector** scores implementations on 7 dimensions:

| Dimension | What it measures |
|-----------|-----------------|
| Code Quality | Clean, readable, follows conventions |
| Error Handling | Graceful failures, no silent swallows |
| Type Safety | Proper types, no `any` leaks |
| Security | No injection, no leaked secrets |
| Performance | No unnecessary allocations or loops |
| Test Coverage | Critical paths covered |
| Completion | All `done_when` criteria met |

Completion = 1, Security = 1, or Type Safety = 1 → hard reject.

### Done-When Verification Chain

The `done_when` field connects agents into a verification loop:

1. **Planner** writes a `done_when` checklist with verifiable completion criteria
2. **Critic** reviews `done_when` quality — low score triggers `/kanban-refine` recommendation
3. **Builder** must verify every `done_when` item before finishing
4. **Inspector** checks that all `done_when` criteria are actually met

---

## Web Board Features

Three views accessible from the top tab bar:

### Board
- **7-column kanban** with real-time task counts
- **Drag-and-drop** between columns (enforces valid status transitions)
- **Card detail modal** with lifecycle progress bar, editable requirements, level selector

### List
- **Inline editing** of status, level, and priority without opening the modal

### Chronicle (연대기)
- **Timeline view** of every lifecycle event across all tasks, grouped by ISO week
- 6 event types: Created · Started · Plan ready · Reviewed · Tested · Completed
- **Agent Activity toggle** — expands `agent_log` entries into the timeline
- Click any event row to open the full task detail modal

### Common
- **Search** by title, description, tags, or `#ID`
- **Sort** by creation date, completion date, or default rank (persisted in localStorage)
- **Hide old Done** toggle (3d+ threshold, persisted in localStorage)
- **Multi-project** support — all projects on one board, or filter by project (persisted in localStorage)
- **Copy card reference** — click to copy `#ID Title` to clipboard
- **Notes** with markdown support
- **Image attachments** with drag-and-drop upload (stored in Cloudflare R2)
- **Markdown rendering** in plan, implementation notes, and reviews
- **Mermaid diagrams** rendered inline
- **Agent log viewer** — full chronological history of all agents per task
- **10s auto-refresh** (pauses when modal is open or dragging)
- **Dark theme** by default

---

## Commands Reference

<details>
<summary><strong>Click to expand all commands</strong></summary>

#### `/kanban` — Task CRUD & Board

| Command | Description |
|---------|-------------|
| `/kanban` or `/kanban list` | View the board as a markdown table |
| `/kanban context` | Session handoff — pipeline state summary |
| `/kanban add <title>` | Create a new task (prompts for priority, level, description, tags) |
| `/kanban move <ID> <status>` | Move a task to a different column (API enforces valid transitions) |
| `/kanban edit <ID>` | Edit task fields interactively |
| `/kanban remove <ID>` | Delete a task |
| `/kanban stats` | Task counts per column and completion rate |

#### `/kanban-run` — Pipeline Orchestration

| Command | Description |
|---------|-------------|
| `/kanban-run <ID> [--auto]` | Run the full AI pipeline (default: pause at reviews, `--auto`: fully automatic) |
| `/kanban-run step <ID>` | Execute only the next pipeline step, then exit |
| `/kanban-run review <ID>` | Trigger code review for a task in `impl_review` status |

#### `/kanban-refine` — Requirements Refinement

| Command | Description |
|---------|-------------|
| `/kanban-refine <ID>` | Refine backlog requirements through structured user interview |

#### `/kanban-explore` — Codebase Exploration & Task Seeding

Use when you have a vague idea but don't know *how* to implement it. Explores the codebase deeply, produces a direction report, then seeds the board with phased tasks. **Does not write code.**

| Command | Description |
|---------|-------------|
| `/kanban-explore <topic>` | Explore codebase, produce direction report, create phased kanban tasks |
| `/kanban-explore` | No topic — immediately enters clarification interview |

**Workflow:**
1. Validates topic context (not word count — checks if why/where is missing)
2. Launches an Explore agent with a structured A–D prompt (structure, relevant code, pain points, constraints)
3. Produces a structured report: current state → key findings → 2–3 directions with pros/cons → recommendation
4. You choose a direction (or "Cancel — save report only")
5. Creates 3–7 phased `todo` tasks, each tagged with `phase:N` and linking back to the report
6. Full exploration report is saved permanently as a `[Explore]` anchor task (`#REPORT_ID`)

**Cancel path**: if you choose Cancel, the report is still saved as an anchor task — no implementation tasks are created.

> Use `/kanban-refine <ID>` after exploring to add more detail to individual tasks before running the pipeline.

</details>

---

## Architecture

```
~/.claude/ and ~/.codex/
├── skills/
│   ├── kanban/              # CRUD & board (SKILL.md + shared context + schema + templates)
│   │   ├── SKILL.md
│   │   ├── shared.md        # Shared context (pipeline, API endpoints, error handling)
│   │   ├── schema.md        # PostgreSQL schema & JSON field formats
│   │   └── templates/       # Agent prompt templates
│   │       ├── plan-agent.md
│   │       ├── review-agent.md
│   │       ├── worker-agent.md
│   │       ├── tdd-tester.md
│   │       ├── code-review-agent.md
│   │       └── test-runner.md
│   ├── kanban-run/          # Pipeline orchestration
│   │   └── SKILL.md
│   ├── kanban-refine/       # Requirements refinement interview
│   │   └── SKILL.md
│   ├── kanban-explore/      # Codebase exploration & task seeding
│   │   └── SKILL.md
│   └── kanban-init/         # Project registration skill
│       └── SKILL.md
└── kanban-board/            # Central web board (Vite + TypeScript → Neon PostgreSQL)
    ├── plugins/kanban-api.ts
    ├── .env.example         # Template — copy to .env and fill in credentials
    └── .env                 # DATABASE_URL + CLOUDFLARE_R2_* (gitignored)

Neon PostgreSQL              # Centralized DB — all projects, all PCs
└── tasks table              # `project` column isolates per-project data

<project>/
├── .claude/kanban.json      # Project config {"project": "my-project"}
├── .codex/kanban.json       # Same project config for Codex
└── kanban-board/start.sh    # Launcher: ~/.codex/kanban-board 우선, 없으면 ~/.claude/kanban-board
```

All task data lives in Neon — accessible from any machine without file sync.

---

## Cross-PC Sync

Task data is stored in **Neon PostgreSQL** — sync across PCs is built-in.
Any machine with the `DATABASE_URL` and the kanban-board running sees the same data instantly.

No OneDrive, no symlinks, no WAL conflicts.

---

## Other Skills

This repo also includes utility skills:

| Skill | Description |
|-------|-------------|
| **model-router** | Routes Task tool subagents to optimal Claude model (Haiku/Sonnet/Opus) based on task complexity |
| **gemini-claude-loop** | Dual-AI engineering loop — Claude plans and implements, Gemini validates and reviews |

Install: `cp -R <skill-folder> ~/.claude/skills/` or `~/.codex/skills/` (or symlink from repo)

---

## License

MIT
