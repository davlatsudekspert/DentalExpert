#!/usr/bin/env bash
# CI helper: local D1 with all migrations + `wrangler pages dev` with dev-only secrets (email codes echoed, localhost
# only). Then runs the API and browser suites, clearing rate limits between them.
# Env: DE_PORT (default 8788), D1_PERSIST (the --persist-to directory, default .wrangler/state), DIST (default dist).
# When a server already answers on DE_PORT it is used as is (then D1_PERSIST must be the directory it persists to).
set -euo pipefail
cd "$(dirname "$0")/.."
export DE_PORT="${DE_PORT:-8788}" D1_PERSIST="${D1_PERSIST:-.wrangler/state}"
DIST="${DIST:-dist}"
URL="http://127.0.0.1:$DE_PORT/api/auth/me"
if ! curl -sf "$URL" >/dev/null; then
 printf 'AUTH_SECRET=%s\nAUTH_DEV_ECHO=1\n' "$(openssl rand -hex 32)" > .dev.vars
 CI=1 npx wrangler d1 migrations apply dental-expert --local --persist-to "$D1_PERSIST" >/dev/null
 npx wrangler pages dev "$DIST" --port "$DE_PORT" --persist-to "$D1_PERSIST" --d1 DB=8b0734eb-b1db-4bd7-9bbf-60d9db51f658 --show-interactive-dev-session=false > /tmp/pages-dev.log 2>&1 &
fi
for i in $(seq 1 60); do curl -sf "$URL" >/dev/null && break; sleep 2; done
curl -sf "$URL" >/dev/null || { cat /tmp/pages-dev.log; exit 1; }
reset(){ npx wrangler d1 execute dental-expert --local --persist-to "$D1_PERSIST" --command "DELETE FROM rate_limits; DELETE FROM auth_codes;" >/dev/null; }
for t in "$@"; do reset; echo "::group::$t"; python3 "tools/$t.py"; echo "::endgroup::"; done
