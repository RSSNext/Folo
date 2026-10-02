# Verifying a macOS desktop build

Used for the PR build ("Folo Staging.app", B3) and for the static checks of the release build ("Folo.app", C4).

## 1. Download and static checks

```bash
RUN=<build run id>
DIR="$SCRATCH/pr/macos-arm64"
gh run download "$RUN" -n macos-arm64-dmg -D "$DIR"
DMG=$(find "$DIR" -name '*-macos-arm64.dmg' | head -1)
YML=$(find "$DIR" -name latest-mac.yml | head -1)

# sha512 and size must match the dmg entry in latest-mac.yml
openssl dgst -sha512 -binary "$DMG" | base64
stat -f %z "$DMG"
grep -A2 "url: $(basename "$DMG")" "$YML"

# mount read-only, copy the app out, detach
mkdir -p "$DIR/mnt" "$DIR/app"
hdiutil attach -nobrowse -readonly -noautoopen -mountpoint "$DIR/mnt" "$DMG"
SRC_APP=$(find "$DIR/mnt" -maxdepth 1 -name '*.app' | head -1)
APP="$DIR/app/$(basename "$SRC_APP")"
ditto "$SRC_APP" "$APP"
hdiutil detach "$DIR/mnt" -quiet

plutil -p "$APP/Contents/Info.plist" | grep -E 'CFBundle(Identifier|Name|ShortVersionString|Version)"'
codesign --verify --deep --strict --verbose=1 "$APP"
codesign -dv "$APP" 2>&1 | grep -E 'Identifier=|TeamIdentifier'
spctl -a -vv -t exec "$APP"
xcrun stapler validate "$APP"
```

Expected: bundle ID `is.follow`; name "Folo Staging" for PR builds and "Folo" for release builds; `CFBundleShortVersionString` is the new version; team `492J8Q67PF`; codesign "valid on disk" and "satisfies its Designated Requirement"; spctl "accepted" with `source=Notarized Developer ID`; stapler "The validate action worked!". The dmg itself carries no stapled ticket, which is normal.

For a release build, take the dmg and `latest-mac.yml` from the GitHub release instead of the run artifact. For the x64 dmg (`macos-x64-dmg`), run the same checks and don't launch it.

## 2. Launch an isolated copy

What shapes the launch:

- Staging and release builds share bundle ID `is.follow`, the userData name "Folo" and the log file `~/Library/Logs/Folo/main.log` with the user's own Folo, which is usually running. `FOLO_E2E_USER_DATA_DIR` gives the test copy its own profile, cookies and single-instance lock.
- On startup every packaged build syncs its signed-in session to the Folo CLI by running `npx folocli login --token …`, which rewrites `~/.folo/config.json`. Launch with `PATH=/usr/bin:/bin:/usr/sbin:/sbin` so `npx` is not found ("npx is not available" in the log is expected), and back the file up anyway.
- The app registers the `folo://` and `follow://` schemes for `is.follow` at startup. Unregister the copy from LaunchServices when done. `/Applications` also holds the Mac App Store build ("Folo 2.app", the highest build number), which normally owns those schemes.
- The user's own Folo may already listen on a CDP port (often 9333); pick a free one.

Profile:

- Signed in: copy a profile that is signed in to the demo account (1Password item `mczvztynp5if7izw5wvmoggtru`): `~/Library/Application Support/Folo(release-qa)` if it exists, else `~/Library/Application Support/Folo(store-demo)`. Never launch against the user's own profile (`~/Library/Application Support/Folo`) or against the original demo directory.
- No demo profile: create `Folo(release-qa)` once. Launch `/Applications/Folo.app/Contents/MacOS/Folo` with `FOLO_E2E_USER_DATA_DIR="$HOME/Library/Application Support/Folo(release-qa)"` and the restricted `PATH` below, and sign it in to the demo account; an agent that may not type passwords asks the user to do that sign-in. Until then, use an empty directory (guest) and mark the signed-in items "not run".

```bash
PORT=9336
while lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do PORT=$((PORT + 1)); done

SRC="$HOME/Library/Application Support/Folo(release-qa)"
[ -d "$SRC" ] || SRC="$HOME/Library/Application Support/Folo(store-demo)"
PROFILE="$SCRATCH/profile"
rsync -a --exclude 'Cache' --exclude 'Code Cache' --exclude 'GPUCache' --exclude 'Dawn*Cache' \
  --exclude 'Singleton*' --exclude 'DevToolsActivePort' "$SRC/" "$PROFILE/"

cp ~/.folo/config.json "$SCRATCH/folo-cli-config.backup.json" 2>/dev/null || true
LAUNCHED_AT=$(date '+%Y-%m-%d %H:%M:%S')
EXE="$APP/Contents/MacOS/$(plutil -extract CFBundleExecutable raw "$APP/Contents/Info.plist")"
(PATH=/usr/bin:/bin:/usr/sbin:/sbin FOLO_E2E_USER_DATA_DIR="$PROFILE" \
  nohup "$EXE" --remote-debugging-port=$PORT > "$SCRATCH/app-stdout.log" 2>&1 &)

for i in $(seq 1 30); do
  curl -fsS "http://127.0.0.1:$PORT/json/list" 2>/dev/null | jq -e '.[] | select(.type == "page")' >/dev/null && break
  sleep 1
done
```

The main window appears on the user's screen; keep the session short.

## 3. Drive the app and check

- `agent-browser --cdp $PORT tab` lists the targets; the main window is the `page` whose URL ends in `dist/renderer/index.html#/…`. Use `--cdp $PORT` on every command, or `agent-browser connect $PORT` once.
- `agent-browser --cdp $PORT snapshot -i` gives element refs; then `click @eN`, `fill @eN "text"`, `press Enter`, `screenshot "$SCRATCH/shots/<item>.png"`.
- State through `agent-browser --cdp $PORT eval "<js>"`:
  - signed-in user: `window.store_user.getState().whoami?.id` (null means guest)
  - renderer version: `window.version`
  - main process version: `window.electron.ipcRenderer.invoke('app.getAppVersion')` (`eval` resolves promises but rejects top-level `await`; wrap multi-step code in an async IIFE)
  - current route: `location.hash`
- Native menus, dialogs and the tray are outside the renderer; use a computer-use tool (context menus need a real right click).
- One screenshot per checklist item; record the result in `verification.md` as you go.
- The demo account is shared with the store screenshot work. Read only by default: no "mark all as read", unsubscribing, deleting, purchases or AI tasks left behind; revert any setting you change. Before a coordinate click, confirm the expected screen is in front.
- Errors since launch (the user's own app writes to the same file, so judge each line):
  ```bash
  awk -v t="[$LAUNCHED_AT" '$0 >= t' ~/Library/Logs/Folo/main.log | grep -E '\[(error|warn)\]'
  ```

## 4. Tear down

```bash
pkill -TERM -f "$EXE"
sleep 3
if [ -f "$SCRATCH/folo-cli-config.backup.json" ] && ! cmp -s ~/.folo/config.json "$SCRATCH/folo-cli-config.backup.json"; then
  cp "$SCRATCH/folo-cli-config.backup.json" ~/.folo/config.json
fi
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -u "$APP"
rm -rf "$DIR/app" "$DIR/mnt" "$PROFILE"
```

Check nothing is left running: `pgrep -fl "$EXE"`. Don't match on the app name alone; the user has their own `/Applications/Folo Staging.app`.
