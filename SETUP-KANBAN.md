# Kanban Setup Guide (Post Oracle Cloud Migration)

This document is for Claude Code to execute. Read this file and follow the steps below.

## Prerequisites

- `~/.claude/skills/` symlinked to this repo's skill directories (or repo cloned to `~/dev/cyanluna.skills`)
- `pnpm` installed globally
- Network access to `https://cyanlunakanban.vercel.app`

## Step 1: Install kanban-board dependencies

```bash
cd ~/dev/cyanluna.skills/kanban-board
pnpm install
```

## Step 2: Set up global kanban auth

Write the file `~/.claude/kanban-auth` with this exact content:

```
KANBAN_BASE_URL=https://cyanlunakanban.vercel.app
KANBAN_AUTH_TOKEN=2+pg9CUzHgjjKDXxWNpMuRpnVPTTAZ5T042F+nwLz5M=
```

This file is shared across all projects. Do NOT put this in git.

## Step 3: Initialize all projects

For each project directory listed below, run these commands:

| Directory | Project Name |
|-----------|-------------|
| `~/dev/ai.coach` | `ai.coach` |
| `~/dev/ai.cycling.workout.planner` | `ai.cycling.workout.planner` |
| `~/dev/asan.bicycle` | `asan.bicycle` |
| `~/dev/assist.11th` | `assist.11th` |
| `~/dev/assist.ai.mba` | `assist.ai.mba` |
| `~/dev/cpet.db` | `cpet` |
| `~/dev/cyanluna.portfolio` | `cyanluna-portfolio` |
| `~/dev/cyanluna.skills` | `cyanluna.skills` |
| `~/dev/today.bike` | `today.bike` |
| `~/dev/una.house.fiance` | `unahouse.finance` |

For each project, create these files if they don't exist:

### `.claude/kanban.json` and `.codex/kanban.json`

```json
{
  "project": "<PROJECT_NAME>"
}
```

Use the project name from the table above (not the directory name).

### `kanban-board/start.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
if [ -d "$HOME/.codex/kanban-board" ]; then
  pnpm --dir "$HOME/.codex/kanban-board" dev
elif [ -d "$HOME/.claude/kanban-board" ]; then
  pnpm --dir "$HOME/.claude/kanban-board" dev
else
  echo "kanban-board not found in ~/.codex/kanban-board or ~/.claude/kanban-board" >&2
  exit 1
fi
```

Make it executable: `chmod +x kanban-board/start.sh`

## Step 4: Verify

Run this to confirm the API is reachable and data is intact:

```bash
source ~/.claude/kanban-auth
curl -s -H "X-Kanban-Auth: $KANBAN_AUTH_TOKEN" \
  "$KANBAN_BASE_URL/api/board?project=cyanluna.skills&summary=true" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK - {d[\"total\"]} tasks')"
```

Expected output: `OK - 31 tasks` (or more if new tasks were added).

## Architecture Summary

```
[All Projects] --> ~/.claude/kanban-auth (global auth)
                       |
                       v
              Vercel (cyanlunakanban.vercel.app)
              vercel-api-handler.js (pg driver)
                       |
                       v
              Oracle Cloud E2.1.Micro (168.138.52.26)
              Docker PostgreSQL 16 on port 55951
              DB: kanban, User: kanban_user
```

- Vercel handles the API layer (serverless, zero maintenance)
- Oracle Cloud Always Free tier hosts PostgreSQL (zero cost)
- Port 55951 is used instead of 5432 to avoid bot scanning
- All projects share a single PostgreSQL database, isolated by `project` column
