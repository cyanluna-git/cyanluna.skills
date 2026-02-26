#!/usr/bin/env bash
#
# webhook-tunnel.sh — Start cloudflared tunnel + auto-register Bitbucket webhooks
#
# Usage:
#   ./scripts/webhook-tunnel.sh                  # Start tunnel + update webhooks
#   ./scripts/webhook-tunnel.sh --repos-only     # Just list configured repos
#   ./scripts/webhook-tunnel.sh --kill            # Kill running tunnel
#
# Config:
#   WEBHOOK_REPOS in webhook-repos.conf (one repo slug per line)
#   Bitbucket credentials from jarvis.gerald/.env
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
JARVIS_DIR="$HOME/Dev/jarvis.gerald"
REPOS_CONF="$SCRIPT_DIR/webhook-repos.conf"
CLOUDFLARED="$HOME/.local/bin/cloudflared"
LOCAL_PORT="${WEBHOOK_PORT:-5173}"
PID_FILE="/tmp/cloudflared-webhook.pid"
URL_FILE="/tmp/cloudflared-webhook.url"
TUNNEL_LOG="/tmp/cloudflared-webhook.log"
WEBHOOK_DESCRIPTION="Javis Auto Review"

# ── Load Bitbucket credentials ──────────────────────────
if [[ -f "$JARVIS_DIR/.env" ]]; then
  while IFS='=' read -r key value; do
    [[ "$key" =~ ^#.*$ || -z "$key" ]] && continue
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < "$JARVIS_DIR/.env"
fi

BB_USER="${JIRA_EMAIL:?JIRA_EMAIL not set}"
BB_TOKEN="${BITBUCKET_API_TOKEN:?BITBUCKET_API_TOKEN not set}"
BB_WORKSPACE="${BITBUCKET_WORKSPACE:-ac-avi}"
BB_API="https://api.bitbucket.org/2.0"

# ── Load target repos ──────────────────────────────────
if [[ ! -f "$REPOS_CONF" ]]; then
  echo "ERROR: $REPOS_CONF not found."
  echo "Create it with one repo slug per line."
  exit 1
fi

REPOS=()
while IFS= read -r line; do
  line="${line%%#*}"           # strip comments
  line="${line//$'\r'/}"       # strip CR
  line="${line// /}"           # strip spaces
  [[ -z "$line" ]] && continue
  REPOS+=("$line")
done < "$REPOS_CONF"

if [[ ${#REPOS[@]} -eq 0 ]]; then
  echo "ERROR: No repos in $REPOS_CONF"
  exit 1
fi

# ── Helper: Bitbucket API ──────────────────────────────
bb_api() {
  local method="$1" endpoint="$2"
  shift 2
  curl -s -u "$BB_USER:$BB_TOKEN" -X "$method" \
    -H "Content-Type: application/json" \
    "${BB_API}${endpoint}" "$@"
}

# ── Find or create webhook for a repo ──────────────────
update_webhook() {
  local repo="$1" tunnel_url="$2"
  local webhook_url="${tunnel_url}/api/webhook/bitbucket"
  local hooks_endpoint="/repositories/$BB_WORKSPACE/$repo/hooks"

  # List existing webhooks, find ours by description
  local existing
  existing=$(bb_api GET "$hooks_endpoint" 2>/dev/null) || existing="{}"

  local hook_uuid=""
  hook_uuid=$(python3 -c "
import json, sys
try:
    data = json.loads(sys.argv[1])
    for h in data.get('values', []):
        if h.get('description') == sys.argv[2]:
            print(h['uuid']); break
except: pass
" "$existing" "$WEBHOOK_DESCRIPTION" 2>/dev/null) || true

  local payload="{\"description\":\"$WEBHOOK_DESCRIPTION\",\"url\":\"$webhook_url\",\"active\":true,\"events\":[\"pullrequest:created\",\"pullrequest:updated\"]}"

  if [[ -n "$hook_uuid" ]]; then
    bb_api PUT "$hooks_endpoint/$hook_uuid" -d "$payload" > /dev/null 2>&1
    echo "  ✓ $repo — updated (${hook_uuid:0:12})"
  else
    local result
    result=$(bb_api POST "$hooks_endpoint" -d "$payload" 2>/dev/null) || result="{}"
    local new_uuid
    new_uuid=$(python3 -c "import json,sys; print(json.loads(sys.argv[1]).get('uuid','???'))" "$result" 2>/dev/null) || new_uuid="???"
    echo "  + $repo — created (${new_uuid:0:12})"
  fi
}

# ── --kill ─────────────────────────────────────────────
if [[ "${1:-}" == "--kill" ]]; then
  if [[ -f "$PID_FILE" ]]; then
    pid=$(cat "$PID_FILE")
    kill "$pid" 2>/dev/null && echo "Killed tunnel (PID $pid)" || echo "PID $pid not running"
    rm -f "$PID_FILE" "$URL_FILE"
  else
    echo "No tunnel running"
  fi
  exit 0
fi

# ── --repos-only ───────────────────────────────────────
if [[ "${1:-}" == "--repos-only" ]]; then
  echo "Configured repos (${#REPOS[@]}):"
  for r in "${REPOS[@]}"; do echo "  - $r"; done
  exit 0
fi

# ── Kill old tunnel ────────────────────────────────────
if [[ -f "$PID_FILE" ]]; then
  old_pid=$(cat "$PID_FILE")
  kill "$old_pid" 2>/dev/null && echo "Killed old tunnel (PID $old_pid)" || true
  sleep 1
  rm -f "$PID_FILE" "$URL_FILE"
fi

# ── Check cloudflared ──────────────────────────────────
if [[ ! -x "$CLOUDFLARED" ]]; then
  echo "ERROR: cloudflared not found at $CLOUDFLARED"
  exit 1
fi

# ── Start cloudflared ──────────────────────────────────
echo "Starting cloudflared tunnel → localhost:$LOCAL_PORT ..."
$CLOUDFLARED tunnel --url "http://localhost:$LOCAL_PORT" > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
echo "$TUNNEL_PID" > "$PID_FILE"

# Wait for URL (max 15s)
TUNNEL_URL=""
for _ in $(seq 1 30); do
  sleep 0.5
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1) || true
  [[ -n "$TUNNEL_URL" ]] && break
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "ERROR: Failed to get tunnel URL within 15s. Log: $TUNNEL_LOG"
  kill "$TUNNEL_PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  exit 1
fi

echo "$TUNNEL_URL" > "$URL_FILE"
echo ""
echo "══════════════════════════════════════════════════════"
echo "  Tunnel: $TUNNEL_URL"
echo "  PID:    $TUNNEL_PID"
echo "  Log:    $TUNNEL_LOG"
echo "══════════════════════════════════════════════════════"
echo ""

# ── Update Bitbucket webhooks ──────────────────────────
echo "Updating Bitbucket webhooks (${#REPOS[@]} repos)..."
for repo in "${REPOS[@]}"; do
  update_webhook "$repo" "$TUNNEL_URL"
done

echo ""
echo "Done! Tunnel running in background."
echo "  Stop:    $0 --kill"
echo "  Log:     tail -f $TUNNEL_LOG"
echo "  Webhook: $TUNNEL_URL/api/webhook/bitbucket"
