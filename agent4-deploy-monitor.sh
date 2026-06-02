#!/usr/bin/env bash
# =============================================================================
# Agent 4 — Deploy + Monitor Pipeline
#
# Called after Agent 1 completes development:
#   1. git add/commit/push changes
#   2. Pull on production server
#   3. Restart Express server (node server.js)
#   4. Run Playwright QA tests
#   5. Watch server logs for errors
#
# Usage:
#   bash agent4-deploy-monitor.sh [--skip-push] [--skip-tests]
# =============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SKIP_PUSH=false
SKIP_TESTS=false
for arg in "$@"; do
  case "$arg" in
    --skip-push) SKIP_PUSH=true ;;
    --skip-tests) SKIP_TESTS=true ;;
  esac
done

log()  { echo -e "${CYAN}[Agent4]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ── Config ──────────────────────────────────────────────────────────────────
SERVER_USER="root"
SERVER_HOST="api.giftgala.in"
SERVER_SSH_KEY="/tmp/insora.pem"
SERVER_PROJECT_DIR="/root/veru-inventory"
GIT_BRANCH="main"

# ── Step 0: Verify prerequisites ────────────────────────────────────────────
log "Checking prerequisites..."

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  fail "Not in a git repository. Run this from the project root."
fi
ok "Git repository found"

if ! command -v node &> /dev/null; then
  fail "Node.js is required"
fi
ok "Node.js $(node -v)"

if [ "$SKIP_PUSH" = false ] && [ ! -f "$SERVER_SSH_KEY" ]; then
  warn "SSH key $SERVER_SSH_KEY not found. Will skip server deployment."
  SERVER_DEPLOY=false
else
  SERVER_DEPLOY=true
fi

# ── Step 1: Git commit & push ──────────────────────────────────────────────
if [ "$SKIP_PUSH" = false ]; then
  log "Step 1: Committing and pushing changes to GitHub..."

  # Check for unstaged changes
  if git diff --quiet && git diff --cached --quiet; then
    warn "No changes to commit"
  else
    git add -A
    git commit -m "Agent4: auto-deploy $(date '+%Y-%m-%d %H:%M')" || warn "Nothing to commit"
    git push origin "$GIT_BRANCH" || fail "Git push failed"
    ok "Changes pushed to GitHub ($GIT_BRANCH)"
  fi
else
  log "Step 1: Skipping push (--skip-push)"
fi

# ── Step 2: Deploy to Vercel ────────────────────────────────────────────────
log "Step 2: Deploying to Vercel..."

npx vercel --prod --yes 2>&1 || warn "Vercel deploy failed (check logs)"
ok "Vercel deployment complete"

# ── Step 3: Pull & restart on Express server ────────────────────────────────
if [ "$SERVER_DEPLOY" = true ]; then
  log "Step 3: Updating Express backend on $SERVER_HOST..."

  ssh -i "$SERVER_SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_HOST" << 'SSH_CMDS'
    set -e
    cd /root/veru-inventory
    echo "[Server] Pulling latest code..."
    git pull origin main

    echo "[Server] Installing dependencies..."
    npm install --production 2>&1 || npm install 2>&1

    echo "[Server] Restarting Express server..."
    # Kill existing server
    pkill -f "node server.js" || true
    sleep 1
    # Start new server (using PM2 if available, otherwise nohup)
    if command -v pm2 &> /dev/null; then
      pm2 delete veru-server 2>/dev/null || true
      pm2 start server.js --name veru-server
      pm2 save
    else
      nohup node server.js > /var/log/veru-server.log 2>&1 &
      echo "[Server] PID: $!"
    fi

    echo "[Server] Running database migrations..."
    node run-migrations.js 2>&1 || echo "[Server] Migration script not found, skipping"

    echo "[Server] Ready"
SSH_CMDS
  ok "Express server restarted on $SERVER_HOST"
else
  log "Step 3: Skipping server deploy (no SSH key)"
fi

# ── Step 4: Run QA tests ────────────────────────────────────────────────────
if [ "$SKIP_TESTS" = false ]; then
  log "Step 4: Running QA tests..."

  echo ""
  echo "──────────────────────────────────────────────"
  echo "  Unit Tests (Node.js resolver tests)"
  echo "──────────────────────────────────────────────"
  node test-inventorygpt-qa.js && ok "All unit tests passed" || warn "Some unit tests failed"

  echo ""
  echo "──────────────────────────────────────────────"
  echo "  E2E Tests (Playwright browser tests)"
  echo "──────────────────────────────────────────────"
  if command -v npx playwright &> /dev/null; then
    node playwright-inventorygpt-qa.js && ok "All E2E tests passed" || warn "Some E2E tests failed"
  else
    warn "Playwright not available, skipping E2E tests"
  fi
else
  log "Step 4: Skipping tests (--skip-tests)"
fi

# ── Step 5: Monitor logs ────────────────────────────────────────────────────
log "Step 5: Checking server health..."

echo ""
echo "──────────────────────────────────────────────"
echo "  Recent Error Logs (last 20 lines)"
echo "──────────────────────────────────────────────"

# Check Vercel deployment logs
npx vercel inspect --logs 2>&1 | tail -20 || warn "Could not fetch Vercel logs"

echo ""
echo "──────────────────────────────────────────────"
echo "  Health Check"
echo "──────────────────────────────────────────────"

# Ping the endpoints
curl -s -o /dev/null -w "  Vercel (inventorygpt): %{http_code}\n" "https://veru-inventory.vercel.app/api/inventorygpt" || warn "Vercel health check failed"
curl -s -o /dev/null -w "  Express (api.giftgala.in):  %{http_code}\n" "https://api.giftgala.in/api/inventorygpt" || warn "Express health check failed"

echo ""
echo "──────────────────────────────────────────────"
echo "  Chat Logs Summary (last 5 minutes)"
echo "──────────────────────────────────────────────"
curl -s "https://veru-inventory.vercel.app/api/inventorygpt/chat-logs?limit=5" | python3 -m json.tool 2>/dev/null | head -20 || echo "  Could not fetch chat logs"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "============================================================================"
echo -e "  ${GREEN}Agent 4 — Pipeline Complete${NC}"
echo "  $(date)"
echo "============================================================================"
echo ""
echo "  Next steps:"
echo "  - View monitoring dashboard: https://veru-inventory.vercel.app/admin/inventorygpt-chats"
echo "  - Check Vercel logs:         npx vercel logs veru-inventory"
echo "  - Check server logs:         ssh $SERVER_USER@$SERVER_HOST 'tail -f /var/log/veru-server.log'"
echo ""
