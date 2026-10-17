#!/usr/bin/env bash
# Installs the simulator build, records a video and runs the given Maestro flows one after another on $SIM_UDID.
# Usage: SIM_UDID=... APP_PATH=.../App.app OUT_DIR=... run_flows.sh flows/01_onboarding_uz.yaml [more flows...]
# Values passed to the flows as Maestro env (-e) when set: DENTIST_EMAIL TEACHER_EMAIL STUDENT_EMAIL GROUP_NAME
# QUIZ_OPTION_RE E2E_PROXY.
# Output in $OUT_DIR: screenshots/<flow>/*.png, video/simulator.mp4, maestro/<flow>/ (reports, debug output,
# failure screenshots), maestro/<flow>.xml (JUnit), logs/simulator-app*.log, summary.md.
# Exit code: 0 when every flow passed, 1 otherwise. Every flow runs even if an earlier one failed.
set -uo pipefail

: "${SIM_UDID:?SIM_UDID is required (see boot_simulator.sh)}"
: "${APP_PATH:?APP_PATH must point at the built App.app}"
: "${OUT_DIR:?OUT_DIR is required}"
[ "$#" -gt 0 ] || { echo "usage: run_flows.sh <flow.yaml>..."; exit 2; }
APP_ID="${APP_ID:-uz.dentalexpert.app}"
MAESTRO="${MAESTRO_BIN:-maestro}"
export MAESTRO_CLI_NO_ANALYTICS=1 MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-240000}"

mkdir -p "$OUT_DIR"/{screenshots,video,maestro,logs}
OUT_DIR="$(cd "$OUT_DIR" && pwd)"
SUMMARY="$OUT_DIR/summary.md"

echo "Installing $APP_PATH on $SIM_UDID"
xcrun simctl install "$SIM_UDID" "$APP_PATH" || { echo "::error::simctl install failed"; exit 1; }

# Video of the whole run. recordVideo only writes a playable file when stopped with SIGINT.
# Non-interactive bash starts background jobs with SIGINT ignored; job control (set -m) keeps SIGINT deliverable.
REC_PID=""
set -m
xcrun simctl io "$SIM_UDID" recordVideo --codec=h264 --force "$OUT_DIR/video/simulator.mp4" \
  > "$OUT_DIR/logs/recordVideo.log" 2>&1 &
REC_PID=$!
set +m
stop_recording() {
  [ -n "$REC_PID" ] || return 0
  kill -INT "$REC_PID" 2>/dev/null || true
  for _ in $(seq 1 30); do kill -0 "$REC_PID" 2>/dev/null || break; sleep 1; done
  kill -9 "$REC_PID" 2>/dev/null || true
  REC_PID=""
}
trap stop_recording EXIT
sleep 3
LOG_START="$(date '+%Y-%m-%d %H:%M:%S')"

ENV_ARGS=()
for v in DENTIST_EMAIL TEACHER_EMAIL STUDENT_EMAIL GROUP_NAME QUIZ_OPTION_RE E2E_PROXY; do
  if [ -n "${!v:-}" ]; then ENV_ARGS+=(-e "$v=${!v}"); fi
done

{ echo "| Flow | Result | Time |"; echo "|---|---|---|"; } > "$SUMMARY"
FAILED=0
for FLOW in "$@"; do
  FLOW_ABS="$(cd "$(dirname "$FLOW")" && pwd)/$(basename "$FLOW")"
  NAME="$(basename "$FLOW" .yaml)"
  WORK="$OUT_DIR/maestro/$NAME"
  mkdir -p "$WORK" "$OUT_DIR/screenshots/$NAME"
  echo "::group::Maestro: $NAME"
  T0=$(date +%s)
  # Run inside $WORK: older Maestro versions save takeScreenshot files relative to the working directory.
  ( cd "$WORK" && "$MAESTRO" --device "$SIM_UDID" test "$FLOW_ABS" ${ENV_ARGS[@]+"${ENV_ARGS[@]}"} \
      --format junit --output "$OUT_DIR/maestro/$NAME.xml" \
      --test-output-dir "$WORK/output" --debug-output "$WORK/debug" ) 2>&1 | tee "$WORK/maestro.log"
  RC=${PIPESTATUS[0]}
  SECS=$(( $(date +%s) - T0 ))
  echo "::endgroup::"
  # Named screenshots from takeScreenshot (onboarding-*, dentist-*, ...); Maestro's own per-step and failure
  # screenshots stay in maestro/<flow>/.
  find "$WORK" -type f -name '*.png' | grep -E '/(onboarding|dentist|teacher|student)-[^/]*\.png$' \
    | while read -r f; do cp "$f" "$OUT_DIR/screenshots/$NAME/"; done
  if [ "$RC" -eq 0 ]; then
    echo "| $NAME | passed | ${SECS}s |" >> "$SUMMARY"
  else
    FAILED=1
    echo "| $NAME | **FAILED** (exit $RC) | ${SECS}s |" >> "$SUMMARY"
    echo "::error::Maestro flow $NAME failed (exit $RC); see maestro/$NAME/ in the artifacts"
    xcrun simctl io "$SIM_UDID" screenshot "$OUT_DIR/screenshots/$NAME/zz-after-failure.png" >/dev/null 2>&1 || true
  fi
done

stop_recording

# Simulator system log of the app (WKWebView console errors and native plugin messages land here).
xcrun simctl spawn "$SIM_UDID" log show --style compact --start "$LOG_START" --predicate 'process == "App"' \
  > "$OUT_DIR/logs/simulator-app.log" 2>&1 || true
xcrun simctl spawn "$SIM_UDID" log show --style compact --start "$LOG_START" \
  --predicate 'process == "App" OR process CONTAINS "WebContent" OR process CONTAINS "Networking"' \
  > "$OUT_DIR/logs/simulator-app-webkit.log" 2>&1 || true
tail -n 400 "$OUT_DIR/logs/simulator-app.log" > "$OUT_DIR/logs/simulator-app-excerpt.log" 2>/dev/null || true

PNGS=$(find "$OUT_DIR/screenshots" -name '*.png' | wc -l | tr -d ' ')
{ echo; echo "Screenshots: $PNGS · video: video/simulator.mp4 · simulator: ${SIM_NAME:-$SIM_UDID} ${SIM_RUNTIME:-}"; } >> "$SUMMARY"
cat "$SUMMARY"
[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$SUMMARY" >> "$GITHUB_STEP_SUMMARY"
exit "$FAILED"
