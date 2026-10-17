#!/usr/bin/env bash
# Stops the servers started by start_local_api.sh. Usage: LOG_DIR=<same dir> stop_local_api.sh
set -uo pipefail
PIDS="${LOG_DIR:?LOG_DIR must point at the start_local_api.sh log dir}/local_api.pids"
[ -f "$PIDS" ] || exit 0
# npx -> node wrangler -> node -> workerd: stop the whole tree, children first.
kill_tree() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null); do kill_tree "$child"; done
  kill -TERM "$1" 2>/dev/null || true
}
while read -r pid; do
  [ -n "$pid" ] && kill_tree "$pid"
done < "$PIDS"
rm -f "$PIDS"
