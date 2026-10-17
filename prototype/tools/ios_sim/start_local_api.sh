#!/usr/bin/env bash
# Starts a throwaway local API for the iOS Simulator sign-in flows:
#   wrangler pages dev (local D1 with all migrations, AUTH_DEV_ECHO=1)  on 127.0.0.1:$API_PORT   (default 8788)
#   tools/ios_sim/e2e_proxy.mjs (captures the echoed sign-in codes)    on 127.0.0.1:$PROXY_PORT (default 8789)
# Nothing here talks to production: the D1 database lives in $PERSIST_DIR and no email is ever sent
# (with AUTH_DEV_ECHO=1 on localhost the code is returned in the response instead of being emailed).
#
# Run from anywhere; needs `npm ci` and `npm run build` done in prototype/ first.
# Env: API_PORT, PROXY_PORT, PERSIST_DIR (default: a new temp dir), LOG_DIR (default: $PERSIST_DIR/logs).
# Writes the server PIDs to $LOG_DIR/local_api.pids so stop_local_api.sh can stop them.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$HERE/../.." && pwd)"   # prototype/
API_PORT="${API_PORT:-8788}"
PROXY_PORT="${PROXY_PORT:-8789}"
PERSIST_DIR="${PERSIST_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/dental-e2e-d1.XXXXXX")}"
LOG_DIR="${LOG_DIR:-$PERSIST_DIR/logs}"
mkdir -p "$PERSIST_DIR" "$LOG_DIR"
export WRANGLER_SEND_METRICS=false
export CI="${CI:-true}"   # non-interactive wrangler (no confirmation prompts)

cd "$APP_DIR"
[ -d dist ] || { echo "::error::prototype/dist is missing; run npm run build first"; exit 1; }

# .dev.vars: written only when absent (fresh CI checkout). An existing developer file is never overwritten,
# but it must enable the dev echo, otherwise the flows cannot read the code.
if [ ! -f .dev.vars ]; then
  SECRET="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
  printf 'AUTH_SECRET=%s\nAUTH_DEV_ECHO=1\n' "$SECRET" > .dev.vars
  echo "Wrote prototype/.dev.vars (AUTH_SECRET random, AUTH_DEV_ECHO=1; git-ignored)."
elif ! grep -q '^AUTH_DEV_ECHO=1' .dev.vars || ! grep -q '^AUTH_SECRET=.' .dev.vars; then
  echo "::error::prototype/.dev.vars exists but lacks AUTH_SECRET=... and AUTH_DEV_ECHO=1"; exit 1
fi
if grep -q '^RESEND_API_KEY=' .dev.vars; then
  echo "::warning::.dev.vars has RESEND_API_KEY; dev echo still wins on localhost, but remove it to be sure no mail is sent."
fi

echo "Applying D1 migrations to the local database in $PERSIST_DIR"
npx wrangler d1 migrations apply dental-expert --local --persist-to "$PERSIST_DIR" > "$LOG_DIR/d1-migrations.log" 2>&1 \
  || { cat "$LOG_DIR/d1-migrations.log"; echo "::error::D1 migrations failed"; exit 1; }
tail -n 5 "$LOG_DIR/d1-migrations.log"

echo "Starting wrangler pages dev on 127.0.0.1:$API_PORT"
nohup npx wrangler pages dev dist --ip 127.0.0.1 --port "$API_PORT" --persist-to "$PERSIST_DIR" \
  --show-interactive-dev-session=false --log-level info > "$LOG_DIR/wrangler.log" 2>&1 &
WRANGLER_PID=$!

echo "Starting e2e proxy on 127.0.0.1:$PROXY_PORT"
nohup node "$HERE/e2e_proxy.mjs" "$PROXY_PORT" "$API_PORT" > "$LOG_DIR/e2e-proxy.log" 2>&1 &
PROXY_PID=$!
printf '%s\n%s\n' "$WRANGLER_PID" "$PROXY_PID" > "$LOG_DIR/local_api.pids"

# Wait until auth reports enabled through the proxy, as the app will see it.
for i in $(seq 1 90); do
  if ! kill -0 "$WRANGLER_PID" 2>/dev/null; then cat "$LOG_DIR/wrangler.log"; echo "::error::wrangler exited"; exit 1; fi
  ME="$(curl -fsS --max-time 3 -H 'origin: capacitor://localhost' -H 'x-client: native' "http://127.0.0.1:$PROXY_PORT/api/auth/me" 2>/dev/null || true)"
  if printf '%s' "$ME" | grep -q '"enabled":true'; then
    echo "Local API ready after ${i}s: $ME"
    exit 0
  fi
  sleep 1
done
tail -n 50 "$LOG_DIR/wrangler.log"
echo "::error::Local API did not report auth enabled within 90s (last /api/auth/me: ${ME:-none})"
exit 1
