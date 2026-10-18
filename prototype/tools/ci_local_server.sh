#!/usr/bin/env bash
# CI helper: local D1 with all migrations + `wrangler pages dev` on :8788 with dev-only secrets (email codes echoed,
# localhost only). Then runs the API and browser suites, clearing rate limits between them.
set -euo pipefail
cd "$(dirname "$0")/.."
if ! curl -sf http://127.0.0.1:8788/api/auth/me >/dev/null; then
 printf 'AUTH_SECRET=%s\nAUTH_DEV_ECHO=1\n' "$(openssl rand -hex 32)" > .dev.vars
 CI=1 npx wrangler d1 migrations apply dental-expert --local >/dev/null
 npx wrangler pages dev dist --port 8788 --d1 DB=8b0734eb-b1db-4bd7-9bbf-60d9db51f658 --show-interactive-dev-session=false > /tmp/pages-dev.log 2>&1 &
fi
for i in $(seq 1 60); do curl -sf http://127.0.0.1:8788/api/auth/me >/dev/null && break; sleep 2; done
curl -sf http://127.0.0.1:8788/api/auth/me >/dev/null || { cat /tmp/pages-dev.log; exit 1; }
reset(){ npx wrangler d1 execute dental-expert --local --command "DELETE FROM rate_limits; DELETE FROM auth_codes;" >/dev/null; }
export D1_PERSIST=.wrangler/state
for t in "$@"; do reset; echo "::group::$t"; python3 "tools/$t.py"; echo "::endgroup::"; done
