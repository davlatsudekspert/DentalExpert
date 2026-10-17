#!/usr/bin/env bash
# Picks an available iPhone simulator on the newest installed iOS runtime (on it preferring $SIM_DEVICE, default
# "iPhone 16"), creates one if none exists, boots it, waits for it and sets a clean status bar (9:41, full battery).
# Prints the UDID; on GitHub Actions also exports SIM_UDID, SIM_NAME and SIM_RUNTIME to $GITHUB_ENV.
# macOS + Xcode only. Needs node (used to read simctl's JSON).
set -euo pipefail

WANT="${SIM_DEVICE:-iPhone 16}"
PICK_JS='
const want=process.argv[1];
const data=JSON.parse(require("fs").readFileSync(0,"utf8"));
const ver=k=>{const m=k.match(/iOS[-.](\d+)[-.](\d+)(?:[-.](\d+))?/);return m?[+m[1],+m[2],+(m[3]||0)]:null};
const cmp=(a,b)=>b[0]-a[0]||b[1]-a[1]||b[2]-a[2];
const runtimes=Object.keys(data.devices).filter(ver).sort((a,b)=>cmp(ver(a),ver(b)));
const phones=r=>data.devices[r].filter(d=>d.isAvailable!==false&&/^iPhone/.test(d.name));
// Newest runtime first; on it the wanted model, else a plain "iPhone N", else "iPhone N Pro", else any iPhone.
let hit=null;
for(const r of runtimes){const list=phones(r);
  const d=list.find(d=>d.name===want)||list.find(d=>/^iPhone \d+$/.test(d.name))||list.find(d=>/^iPhone \d+ Pro$/.test(d.name))||list[0];
  if(d){hit=[d,r];break}}
if(hit)console.log([hit[0].udid,hit[0].name,hit[1]].join("\t"));
'

LINE="$(xcrun simctl list devices available --json | node -e "$PICK_JS" "$WANT")"
if [ -z "$LINE" ]; then
  echo "No available iPhone simulator; creating one on the newest iOS runtime."
  RUNTIME="$(xcrun simctl list runtimes available --json | node -e '
    const r=JSON.parse(require("fs").readFileSync(0,"utf8")).runtimes.filter(x=>x.platform==="iOS"&&x.isAvailable!==false);
    r.sort((a,b)=>b.version.localeCompare(a.version,undefined,{numeric:true}));
    if(r[0])console.log(r[0].identifier)')"
  [ -n "$RUNTIME" ] || { echo "::error::No iOS simulator runtime installed (xcodebuild -downloadPlatform iOS)"; exit 1; }
  TYPE="$(xcrun simctl list devicetypes --json | node -e '
    const want=process.argv[1];
    const t=JSON.parse(require("fs").readFileSync(0,"utf8")).devicetypes.filter(x=>/^iPhone/.test(x.name));
    const d=t.find(x=>x.name===want)||t.reverse().find(x=>/^iPhone \d+$/.test(x.name))||t[0];
    if(d)console.log(d.identifier)' "$WANT")"
  UDID="$(xcrun simctl create "E2E iPhone" "$TYPE" "$RUNTIME")"
  LINE="$(printf '%s\t%s\t%s' "$UDID" "E2E iPhone ($TYPE)" "$RUNTIME")"
fi
IFS=$'\t' read -r UDID NAME RUNTIME <<<"$LINE"
echo "Simulator: $NAME  runtime: $RUNTIME  udid: $UDID"

xcrun simctl boot "$UDID" 2>/dev/null || true   # "already booted" is fine
xcrun simctl bootstatus "$UDID" -b
xcrun simctl ui "$UDID" appearance light || true
xcrun simctl status_bar "$UDID" override --time "9:41" --dataNetwork wifi --wifiMode active --wifiBars 3 \
  --cellularMode active --cellularBars 4 --operatorName "" --batteryState charged --batteryLevel 100 || true
# Open the Simulator app so a window (and screen recording) exists; harmless when headless.
open -a Simulator --args -CurrentDeviceUDID "$UDID" 2>/dev/null || true

if [ -n "${GITHUB_ENV:-}" ]; then
  { echo "SIM_UDID=$UDID"; echo "SIM_NAME=$NAME"; echo "SIM_RUNTIME=$RUNTIME"; } >> "$GITHUB_ENV"
fi
echo "$UDID"
