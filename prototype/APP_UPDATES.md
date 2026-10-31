# Switching old app builds off

Since build 1013 (Android) / the next iOS build, every native build sends its build number (`x-app-build`, `x-app-platform`) and
asks `GET /api/app/config` once at start-up. If the build is below the minimum, the app shows a blocking "Update required"
screen (uz / ru / en) with a store link. Account, class, admin and billing APIs also answer **426** to those builds.

## Cloudflare Pages variables (all optional; nothing set = nothing blocked)
| Variable | Meaning |
|---|---|
| `MIN_BUILD_ANDROID` | lowest allowed Android `versionCode` (1000 + the run number of `android-release.yml`) |
| `MIN_BUILD_IOS` | lowest allowed iOS build number (the run number of `ios-testflight.yml`) |
| `UPDATE_URL_ANDROID` / `UPDATE_URL_IOS` | https store link on the update screen (a non-https value is ignored) |
| `BLOCK_LEGACY_NATIVE=1` | also block native builds that send **no** build number, i.e. every APK/IPA made before this feature |

Change a variable and redeploy (or retry the deployment); no new app build is needed.

## What it can and cannot do
- It switches off the **server** side of an old build: sign-in, classes, admin, billing, trial. The lesson/slide/test/atlas content is
  inside the app package, so an old build keeps showing it offline; only a new build can change that.
- A build **without** this feature (anything before it) cannot show the update screen. With `BLOCK_LEGACY_NATIVE=1` its account/class
  calls fail (it shows its usual network error). That includes old TestFlight / Play builds: they get the same treatment, so set the
  switch only when the new builds are out.
- Android builds installed from an APK file cannot be removed from a phone remotely. They are switched off only as described above.
- Roll back by lowering or deleting the variable.
