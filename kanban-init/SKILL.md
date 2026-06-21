---
name: kanban-init
description: "Register and initialize the current project in PostgreSQL kanban. Usage: /kanban-init or /kanban-init my-project-name. Run with /kanban-init."
license: MIT
---

Registers the current project in **PostgreSQL** (shared central DB) and creates a local config so `/kanban` knows which project to use.
No per-project DB file is created — the central PostgreSQL server handles storage for all projects automatically.

## Usage

```
/kanban-init                                      — project name = basename of current directory, board = localhost
/kanban-init my-project-name                      — explicit project name, board = localhost
/kanban-init my-project-name https://board.example.com
                                                 — explicit project name + remote board URL
/kanban-init https://board.example.com           — current directory name + remote board URL
```

If a URL argument is present, treat it as `base_url`. Strip any leading dashes from the project token: `kanban-init -unahouse.finance` → project `unahouse.finance`.

## Procedure

### 1. Determine project name and board URL

```bash
# Split raw args
set -- $ARG
ARG1="${1:-}"
ARG2="${2:-}"

# Accept either:
#   /kanban-init my-project
#   /kanban-init my-project https://board.example.com
#   /kanban-init https://board.example.com
ARG_BASE_URL=""   # only set when explicitly passed on the command line
if printf '%s' "$ARG1" | grep -Eq '^https?://'; then
  PROJECT=$(basename "$(pwd)" | sed 's/\.db$//')
  ARG_BASE_URL="$ARG1"
else
  PROJECT=$(printf '%s' "$ARG1" | sed 's/^-*//' | sed 's/\.db$//')
  if [ -z "$PROJECT" ]; then
    PROJECT=$(basename "$(pwd)" | sed 's/\.db$//')
  fi
  if printf '%s' "$ARG2" | grep -Eq '^https?://'; then
    ARG_BASE_URL="$ARG2"
  fi
fi

```

**Always strip `.db` suffix** — old configs stored the DB filename as the project name (e.g. `cpet.db`), which would conflict without this fix.

### 1b. Load the shared root auth (single source of truth, cross-platform)

**Always source credentials from the shared store** — never invent a per-project
token. The auth file is resolved **relative to the dev root** (`<dev-root>/.config/kanban/auth`)
by walking up from the current directory, so it works the same on Windows / WSL /
macOS without any hardcoded home path. Env vars override for per-machine / CI.

```bash
# Precedence: $KANBAN_AUTH_TOKEN (env) > $KANBAN_AUTH_FILE > <dev-root>/.config/kanban/auth
#             (walk up from $PWD) > XDG/home fallbacks (backward compat).
SHARED_BASE_URL=""
AUTH_TOKEN=""
AUTH_SRC=""
if [ -n "${KANBAN_AUTH_TOKEN:-}" ]; then
  AUTH_TOKEN="$KANBAN_AUTH_TOKEN"; SHARED_BASE_URL="${KANBAN_BASE_URL:-}"; AUTH_SRC="env"
else
  _cands=()
  [ -n "${KANBAN_AUTH_FILE:-}" ] && _cands+=("$KANBAN_AUTH_FILE")
  _d="$PWD"
  while :; do _cands+=("$_d/.config/kanban/auth"); [ "$_d" = "/" ] && break; _d=$(dirname "$_d"); done
  _cands+=("${XDG_CONFIG_HOME:-$HOME/.config}/kanban/auth" "$HOME/.claude/kanban-auth" "$HOME/.codex/kanban-auth")
  for f in "${_cands[@]}"; do
    [ -n "$f" ] && [ -f "$f" ] || continue
    AUTH_SRC="$f"
    SHARED_BASE_URL=$(grep '^KANBAN_BASE_URL=' "$f" | cut -d= -f2-)
    AUTH_TOKEN=$(grep '^KANBAN_AUTH_TOKEN=' "$f" | cut -d= -f2-)
    break
  done
fi

# BASE_URL priority: explicit CLI arg > shared auth > localhost default
BASE_URL="${ARG_BASE_URL:-${SHARED_BASE_URL:-http://localhost:5173}}"

# Build the auth header from the SHARED token — used by every API call below
AUTH_HEADER=()
[ -n "$AUTH_TOKEN" ] && AUTH_HEADER=(-H "X-Kanban-Auth: $AUTH_TOKEN")

echo "KANBAN_BASE_URL=$BASE_URL"
echo "KANBAN_AUTH=$([ -n "$AUTH_TOKEN" ] && echo "shared key (${AUTH_SRC})" || echo 'none — create <dev-root>/.config/kanban/auth or set KANBAN_AUTH_FILE')"
```

The resulting `AUTH_HEADER` and `BASE_URL` are reused by step 2c (and any other API
call) so `/kanban-init` always authenticates with the shared root key.

### 2. Write local project config

Create both config files in the **current project root**:
- `.claude/kanban.json`
- `.codex/kanban.json`

```json
{
  "project": "<PROJECT_NAME>"
}
```

**kanban.json stores ONLY the project name.** Auth credentials (`base_url`, `auth_token`) live in the shared dev-root store `<dev-root>/.config/kanban/auth`, never in kanban.json.

Use the Write tool to create both files with the same content.

### 2b. Seed the shared auth file ONLY if none was found

Step 1b already resolved the shared key. This step only bootstraps the file on a
**fresh machine** — it must never overwrite an existing shared key.

```bash
if [ -z "$AUTH_TOKEN" ] && [ -z "$AUTH_SRC" ]; then
  # No shared auth found anywhere. Create the canonical dev-root file.
  # Dev root = $KANBAN_DEV_ROOT, else the topmost git repo above $PWD, else ~/dev.
  DEV_ROOT="${KANBAN_DEV_ROOT:-}"
  if [ -z "$DEV_ROOT" ]; then
    _d="$PWD"; _top=""
    while [ "$_d" != "/" ]; do
      [ -d "$_d/.git" ] && _top="$_d"
      _d=$(dirname "$_d")
    done
    DEV_ROOT="${_top:-$HOME/dev}"
  fi
  AUTH_DIR="$DEV_ROOT/.config/kanban"
  mkdir -p "$AUTH_DIR" && chmod 700 "$AUTH_DIR"
  cat > "$AUTH_DIR/auth" << EOF
KANBAN_BASE_URL=$BASE_URL
KANBAN_AUTH_TOKEN=${KANBAN_AUTH_TOKEN:-}
EOF
  chmod 600 "$AUTH_DIR/auth"
  # CRITICAL: keep the secret out of git
  grep -qxF '.config/kanban/' "$DEV_ROOT/.gitignore" 2>/dev/null || printf '\n# kanban shared auth — NEVER commit\n.config/kanban/\n' >> "$DEV_ROOT/.gitignore"
  echo "Created $AUTH_DIR/auth (shared across all projects under $DEV_ROOT)."
fi
```

If a shared key was already found (`$AUTH_SRC` set), **use it as-is** — do NOT
overwrite, and never copy the token into the project's kanban.json.

### 2c. Auto-register project in projects table

After writing the config, upsert the current project to the projects table via POST /api/projects.
Infer project metadata from the local environment:

```bash
# Infer category from path
PARENT_DIR=$(basename "$(dirname "$(pwd)")")
if [ "$PARENT_DIR" = "edwards" ]; then
  CATEGORY="edwards"
elif echo "$PROJECT" | grep -qE 'skills|kanban'; then
  CATEGORY="skills"
elif echo "$PROJECT" | grep -qE 'tools|assist|gmail|jira'; then
  CATEGORY="tools"
elif [ "$PROJECT" = "community.skills" ]; then
  CATEGORY="community"
else
  CATEGORY="personal"
fi

# Infer purpose from CLAUDE.md (first non-heading, non-empty line)
PURPOSE=""
if [ -f "CLAUDE.md" ]; then
  PURPOSE=$(grep -v '^#' CLAUDE.md | grep -v '^---' | grep -v '^\s*$' | head -1 | cut -c1-300)
fi

# Infer stack from CLAUDE.md
STACK=""
if [ -f "CLAUDE.md" ]; then
  STACK=$(grep -iE 'stack|tech|typescript|javascript|python|react|vue|next|node|vite' CLAUDE.md | head -1 | cut -c1-200)
fi

# Infer repo_url from git remote
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")

# Upsert project
PROJ_PAYLOAD=$(python3 -c "
import json
print(json.dumps({
  'id': '$PROJECT',
  'name': '$PROJECT',
  'purpose': '''$PURPOSE''' if '''$PURPOSE''' else None,
  'stack': '''$STACK''' if '''$STACK''' else None,
  'category': '$CATEGORY',
  'repo_url': '$REPO_URL' if '$REPO_URL' else None,
}))
")
curl -s "${AUTH_HEADER[@]}" -X POST "$BASE_URL/api/projects" \
  -H 'Content-Type: application/json' \
  -d "$PROJ_PAYLOAD" > /dev/null 2>&1 || true
```

This is best-effort — if the API call fails (e.g., server not running), init still succeeds.

### 3. Create `kanban-board/start.sh`

```bash
mkdir -p kanban-board
```

Write `kanban-board/start.sh`:
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

Make executable:
```bash
chmod +x kanban-board/start.sh
```

### 4. Output confirmation

Output:
```
✅ Project '<PROJECT_NAME>' registered in kanban.

  Config:  .codex/kanban.json, .claude/kanban.json
  DB:      PostgreSQL (shared central DB)
  Board:   <BASE_URL>/?project=<PROJECT_NAME>
  Auth:    ${AUTH_SRC:-<dev-root>/.config/kanban/auth} (shared, dev-root relative)
  Start:   ./kanban-board/start.sh

Add tasks with /kanban add <title>
```

## Notes

### Existing config detection

If either `.codex/kanban.json` or `.claude/kanban.json` already exists:
1. Read the `project` field and **strip `.db` suffix** (old format stored DB filename as project name)
2. If the config contains legacy `base_url` or `auth_token`, **remove them from kanban.json** (leave only `project`). Migrate the value into `~/.claude/kanban-auth` **only if that file has no token yet** — never overwrite an existing shared key with a stale per-project token (it may be an old/leaked value).
3. If the cleaned name differs from what's stored (e.g. `cpet.db` → `cpet`), show the migration clearly
4. Ask the user whether to overwrite or keep as-is:

```
.codex/kanban.json or .claude/kanban.json already exists:
  Current project: "cpet.db"  →  will use "cpet" (stripped .db suffix)
  Current board: "https://board.example.com"

Options:
1. Overwrite — update config
2. Keep as-is — leave existing config unchanged
```

- The central board (`~/.claude/kanban-board/`) must be installed. If `~/.claude/kanban-board/package.json` doesn't exist, warn the user.
- The central board should exist in either `~/.codex/kanban-board/` or `~/.claude/kanban-board/`. If neither has `package.json`, warn the user.
- `node_modules/` in the local `kanban-board/` is not created (no `pnpm install` needed — the central board handles its own deps).
- The kanban-board server must be running (`./kanban-board/start.sh`) before using `/kanban` commands when `base_url` points at localhost.
- Auth credentials are stored ONCE in the shared dev-root file `<dev-root>/.config/kanban/auth` (resolved by walking up from cwd — cross-platform), NOT in per-project kanban.json. This prevents token duplication across repos and keeps secrets out of git. Resolution precedence: `$KANBAN_AUTH_TOKEN` (env) > `$KANBAN_AUTH_FILE` > `<dev-root>/.config/kanban/auth` > `$XDG_CONFIG_HOME/kanban/auth` > `~/.claude/kanban-auth` > `~/.codex/kanban-auth` (legacy fallbacks).
- The dev-root `.config/kanban/` MUST be gitignored — never commit the token.
- For remote private boards, set `KANBAN_AUTH_TOKEN` in the shell before running `/kanban-init`, or edit `<dev-root>/.config/kanban/auth` directly. Per-machine: export `KANBAN_AUTH_FILE=/abs/path` to point elsewhere.
