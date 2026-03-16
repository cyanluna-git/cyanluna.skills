# Kanban Board Deployment

## Shared-token auth

Production boards are protected by a shared token.

- Server env: `KANBAN_AUTH_TOKEN_SHA256`
- Local browser storage: raw token in `localStorage` as `kanban-auth-token`
- Skill config: optional raw token in `.codex/kanban.json` or `.claude/kanban.json` as `auth_token`

The server never stores the raw token. It compares the presented token against the SHA-256 hash from `KANBAN_AUTH_TOKEN_SHA256`.

## Generate a token and hash

```bash
TOKEN=$(openssl rand -base64 32 | tr -d '\n')
printf '%s\n' "$TOKEN"
printf '%s' "$TOKEN" | shasum -a 256 | awk '{print $1}'
```

- Save the raw `TOKEN` in local config only.
- Save the SHA-256 output in Vercel as `KANBAN_AUTH_TOKEN_SHA256`.

## Vercel env setup

```bash
vercel env add DATABASE_URL production
vercel env add KANBAN_AUTH_TOKEN_SHA256 production
vercel env add KANBAN_PROJECT_NAME production
```

Optional local-dev bypass:

```bash
export KANBAN_ALLOW_INSECURE_LOCAL_DEV=1
```

Localhost bypass is allowed only when no auth hash is configured and the request is served from `localhost` or `127.0.0.1`.

## Required environment variables

Use these values when creating a fresh Vercel project for the board API and frontend.

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection used by the board API |
| `KANBAN_AUTH_TOKEN_SHA256` | yes | SHA-256 of the shared raw token |
| `KANBAN_PROJECT_NAME` | yes | Default project name shown by the board shell |
| `KANBAN_ALLOW_INSECURE_LOCAL_DEV` | no | Localhost-only auth bypass during local dev |

## Deployment runbook

These steps are enough to bring up a new remote board from scratch.

### 1. Link the Vercel project

```bash
cd kanban-board
vercel link
```

### 2. Configure production env

```bash
vercel env add DATABASE_URL production
vercel env add KANBAN_AUTH_TOKEN_SHA256 production
vercel env add KANBAN_PROJECT_NAME production
```

Use the PostgreSQL connection string for `DATABASE_URL`. Generate the shared token locally, save only its SHA-256 hash in Vercel, and keep the raw token in your local config.

### 3. Build and deploy

```bash
pnpm build
vercel --prod
```

### 4. Point the preferred URL at the new deploy

```bash
vercel alias set <deployment-url> cyanlunakanban.vercel.app
```

### 5. Post-deploy checks

- Open `https://cyanlunakanban.vercel.app` and confirm the locked shell renders.
- Confirm `GET /api/board?project=<project>&summary=true` returns `401` without a token.
- Unlock once with `?auth=<raw token>` and confirm the board loads.
- Confirm `GET /api/board/version?project=<project>` returns `200` after auth.

## Client usage

- API clients can send `X-Kanban-Auth: <raw token>`.
- The web board can unlock itself by entering the token in the auth modal.
- For a one-tap mobile open, use `?auth=<raw token>` once. The page stores it locally, creates a session cookie, and removes the query param from the URL.

## Session endpoints

- `GET /api/auth/session` → current auth state
- `POST /api/auth/session` with `X-Kanban-Auth` → validate token and set cookie
- `DELETE /api/auth/session` → clear cookie

## Local skill config for a remote board

Local Codex or Claude skills should keep pointing at the same remote board URL.

Example project config:

```json
{
  "project": "cyanluna.skills",
  "base_url": "https://cyanlunakanban.vercel.app",
  "auth_token": "<raw token>"
}
```

Store that JSON in either:

- `.codex/kanban.json`
- `.claude/kanban.json`

After that, `/kanban`, `/kanban-run`, and `/kanban-batch-run` all talk to the remote Vercel board instead of `localhost`.

Quick API check from a local shell:

```bash
CONFIG=$(cat .codex/kanban.json)
BASE_URL=$(echo "$CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin)['base_url'])")
TOKEN=$(echo "$CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin)['auth_token'])")
PROJECT=$(echo "$CONFIG" | python3 -c "import json,sys; print(json.load(sys.stdin)['project'])")

curl -s \
  -H "X-Kanban-Auth: $TOKEN" \
  "$BASE_URL/api/board?project=$PROJECT&summary=true"
```

## Mobile QA Matrix

Use these breakpoint bands when checking the board after UI changes.

- `<= 640px`: phone portrait
- `641px - 768px`: large phone / small tablet portrait
- `769px - 1024px`: tablet / compact laptop
- `> 1024px`: desktop baseline

Current mobile-first expectations:

- Phone portrait defaults to `List` view on first open.
- The toolbar collapses behind the `Filters` toggle on mobile.
- Board view uses stacked accordion columns with mobile move controls.
- List view uses mobile cards instead of the desktop table.
- Chronicle uses larger event cards and touch targets on mobile.
- Detail, auth, and add-card overlays use bottom-sheet style presentation on mobile and centered modals on desktop.

## Manual Regression Checklist

Run this checklist on `https://cyanlunakanban.vercel.app` after mobile UX or auth changes.

### 1. Auth and entry

- Open the board without a token and confirm the root shell loads but `/api/board?...` returns `401`.
- Open once with `?auth=<raw token>` and confirm the token is stored locally, the query param disappears, and the board unlocks.
- Confirm the auth sheet cannot be dismissed while the board is still locked.
- Use `Forget Token` and confirm the board returns to the locked state.

### 2. Board view

- On mobile, confirm the board renders as stacked columns instead of a 7-column scroller.
- Confirm column expand/collapse works and search expands all columns.
- Confirm card tap opens detail and the mobile status move select still works.
- Confirm `Hide old done` hides done items older than 3 days.

### 3. List view

- On mobile, confirm the list renders as cards without horizontal scroll.
- Confirm each card shows title, status, level, priority, project, dates, and inline controls.
- Confirm editing status/level/priority from a mobile list card persists.
- On desktop, confirm the table layout still renders.

### 4. Chronicle view

- Confirm chronicle groups by ISO week and each event is easy to tap on mobile.
- Confirm search filters chronicle events by ID/title/project.
- Confirm `Hide old done` removes old completed events and empty groups disappear.

### 5. Detail / add-card / auth overlays

- On mobile, confirm the overlays appear as bottom sheets with sticky headers.
- Confirm body scroll is locked while any overlay is open.
- Confirm `Escape`, backdrop click, and close buttons dismiss detail/add-card sheets correctly.
- Confirm the add-card form remains usable with the mobile keyboard open.
- Confirm the auth sheet close button only works when the board is already authenticated.

### 6. Deployment sanity

- Confirm the latest root HTML references the current asset hashes after deploy.
- Confirm protected API endpoints still require auth after alias updates.
- Record the deployed asset hashes and date in the task or release note when a mobile UX batch lands.

## Suggested Screenshot Set

Capture these when closing a mobile UX batch so later regressions are easier to spot:

- Phone portrait: locked auth sheet
- Phone portrait: board accordion view
- Phone portrait: list card view
- Phone portrait: chronicle view
- Phone portrait: detail sheet
- Phone portrait: add-card sheet
- Tablet width: board + toolbar state
- Desktop: list table and centered detail modal

## Limitations and operational notes

- Vercel does not use the local dev SSE path. The production board uses a lightweight `/api/board/version` check and conditional summary reload instead.
- Summary payloads are intentionally trimmed. Full notes, review comments, and other long text stay on `/api/task/:id`.
- Shared-token auth is coarse-grained. Anyone with the raw token can read and mutate the board until the token is rotated.
- Token rotation requires two updates: change `KANBAN_AUTH_TOKEN_SHA256` in Vercel and replace `auth_token` in every local `.codex/kanban.json` or `.claude/kanban.json`.
- After each production deploy, verify the alias still points at the intended deployment and the root HTML references the latest asset hashes.
