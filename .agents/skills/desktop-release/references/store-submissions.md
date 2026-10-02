# Desktop store submissions

Two stores take the store run's packages: the Mac App Store (uploaded by CI, submitted by you) and the Microsoft Store (uploaded and submitted by you). Get the What's New text for every locale from `release-notes.md` first.

## Mac App Store

The app record `6739802604` ("Folo - AI RSS Reader", bundle ID `is.follow`) holds both the iOS and the macOS versions. Use `asc` (App Store Connect API, keychain profile already configured) for every step it supports, and App Store Connect in Chrome for the final look and for anything the API cannot do. Pipe JSON output with `2>/dev/null`; `asc` prints notices on stderr.

### 1. Make sure the build arrived

In the store run, the macOS job step "Upload Mac App Store package to App Store Connect" must have succeeded (`altool --wait`). Its build number comes from the `desktop-build/v<N>` tag created by `tag.yml`. Processing in App Store Connect takes 5–30 minutes; wait in the background:

```bash
for i in $(seq 1 60); do
  line=$(asc builds list --app 6739802604 --platform MAC_OS --version "$VERSION" --processing-state all --output json 2>/dev/null \
    | jq -r '.data[0] | [.id, .attributes.version, .attributes.processingState] | @tsv')
  echo "$line"; case "$line" in *VALID*|*FAILED*|*INVALID*) break ;; esac; sleep 60
done
```

`.attributes.version` is the build number. `VALID` means ready (record `BUILD_ID`); `FAILED` or `INVALID` means stop and report. Both apps set `ITSAppUsesNonExemptEncryption` to false, so no export compliance question is expected.

### 2. Prepare the version

```bash
asc versions list --app 6739802604 --platform MAC_OS --output json 2>/dev/null \
  | jq -r '.data[] | [.id, .attributes.versionString, (.attributes.appVersionState // .attributes.appStoreState)] | @tsv' | head -5
```

- An editable version exists (`PREPARE_FOR_SUBMISSION`, `DEVELOPER_REJECTED`, `REJECTED`, `METADATA_REJECTED`) with another version string: rename it, which keeps its prepared metadata and screenshots: `asc versions update --version-id <id> --version "$VERSION"`.
- None exists: `asc versions create --app 6739802604 --platform MAC_OS --version "$VERSION" --copy-metadata-from "<live macOS version>" --exclude-fields whatsNew --release-type AFTER_APPROVAL`.
- A version is `WAITING_FOR_REVIEW`, `IN_REVIEW` or `PENDING_DEVELOPER_RELEASE`: stop and ask; only one version can be in flight.

Record `VERSION_ID`. The release type stays `AFTER_APPROVAL`.

### 3. What's New in every locale

```bash
asc localizations list --version "$VERSION_ID" --output json 2>/dev/null | jq -r '.data[] | [.id, .attributes.locale] | @tsv'
asc localizations update --id "<localization id>" --whats-new "<text for that locale>"
```

Update every locale by its localization ID (avoids locale-code mismatches). App Store Connect requires What's New for every locale of an update, but `asc validate` only warns about empty ones, so check the lengths yourself; every locale must be above 0:

```bash
asc localizations list --version "$VERSION_ID" --output json 2>/dev/null \
  | jq -r '.data[] | [.attributes.locale, ((.attributes.whatsNew // "") | length)] | @tsv'
```

### 4. Validate and submit

```bash
asc validate --app 6739802604 --version-id "$VERSION_ID" --platform MAC_OS --output table
asc review submit --app 6739802604 --platform MAC_OS --version-id "$VERSION_ID" --build-id "$BUILD_ID" --dry-run
asc review submit --app 6739802604 --platform MAC_OS --version-id "$VERSION_ID" --build-id "$BUILD_ID" --confirm
```

Before the submit, the only blocking finding should be "no build attached" (the submit attaches it). Subscription promotional image warnings and the App Privacy info line are normal. Fix anything else, or ask when the fix is not a What's New or build matter.

### 5. Confirm

```bash
asc versions view --version-id "$VERSION_ID" --include-build --include-submission --output json 2>/dev/null \
  | jq '{state, version: .versionString, build: .buildVersion}'
```

`asc versions view` prints a flat object. Expect `WAITING_FOR_REVIEW` and the new build number. Then open `https://appstoreconnect.apple.com/apps/6739802604/distribution/macos/version/inflight` in Chrome, check the status reads "Waiting for Review" with the right build, and save a screenshot for the report. If App Store Connect shows a banner the API could not handle (new agreements, compliance or declaration questions), agreements go to the user; answer questions only when the previous submission's answers clearly apply, otherwise ask.

## Microsoft Store

Product "Folo - AI RSS Reader", Store ID `9NVFZPV0V0HT`, package identity `NaturalSelectionLabs.Follow-Yourfavoritesinoneinbo`, publisher `CN=7CBBEB6A-9B0E-4387-BAE3-576D0ACA279E`, one x64 `Folo.appx`. Overview: `https://partner.microsoft.com/en-us/dashboard/products/9NVFZPV0V0HT/overview`. Partner Center signs the package itself.

### 1. Get and check the package

```bash
gh run download "$STORE_RUN" -n windows-x64-appx -D "$SCRATCH/msstore"
APPX=$(find "$SCRATCH/msstore" -name '*.appx' | head -1)
unzip -p "$APPX" AppxManifest.xml | tr '\n' ' ' | grep -o '<Identity[^>]*>'
shasum -a 256 "$APPX"; stat -f %z "$APPX"
mkdir -p "$SCRATCH/msstore/chunks"
split -b 9500000 -a 3 "$APPX" "$SCRATCH/msstore/chunks/Folo.appx.part."
ls "$SCRATCH/msstore/chunks"
```

The `<Identity>` element spans several lines in the manifest, hence the `tr`. It must show the name and publisher above, `ProcessorArchitecture="x64"` and `Version="<version>.0"`. The 1.14.0 package was 159 MB, 17 chunks.

### 2. Start the update

On the overview, open the existing in-progress submission if there is one; otherwise click "Start update", which creates submission N+1 as a copy of the live one. Note the submission number.

### 3. Upload the package

If your browser tool can put the whole `.appx` into the package input, do that and skip to step 5. Tools that cap uploads (Claude in Chrome takes under 10 MB per call) need the package in chunks that the page reassembles. This was tested end to end: the reassembled file's SHA-256 matched the original.

1. Open the submission's Packages page. Inject a collector input:
   ```js
   window.__folo = { chunks: [] }
   const collector = document.createElement("input")
   collector.type = "file"
   collector.id = "folo-chunk-input"
   collector.setAttribute("aria-label", "Folo chunk input")
   collector.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:2147483647"
   collector.addEventListener("change", () => {
     window.__folo.chunks.push(...collector.files)
   })
   document.body.append(collector)
   collector.id
   ```
2. Upload the chunks into that input in name order, one upload call per chunk.
3. Reassemble and verify against the local `shasum` and size:
   ```js
   const parts = [...window.__folo.chunks].sort((a, b) => a.name.localeCompare(b.name))
   window.__folo.file = new File(parts, "Folo.appx")
   const hash = await crypto.subtle.digest("SHA-256", await window.__folo.file.arrayBuffer())
   JSON.stringify({
     parts: parts.length,
     size: window.__folo.file.size,
     sha256: [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join(""),
   })
   ```
   On a mismatch, reset `window.__folo.chunks = []` and upload again.
4. Hand the file to Partner Center's package input, the `input[type=file]` behind "Drag your packages here … browse your files" (it may be hidden):
   ```js
   const target = [...document.querySelectorAll("input[type=file]")].find(
     (el) => el.id !== "folo-chunk-input",
   )
   const dt = new DataTransfer()
   dt.items.add(window.__folo.file)
   target.files = dt.files
   target.dispatchEvent(new Event("change", { bubbles: true }))
   ```
   If no upload starts, dispatch `dragenter`, `dragover` and `drop` (`new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt })`) on the drop zone element instead.
5. Wait with tool-side waits and read the page until the new package row shows version `<version>.0`, x64, and passes validation. Leave previously published packages alone. Remove the collector (`document.getElementById('folo-chunk-input')?.remove(); delete window.__folo`) and click Save.

Partner Center tabs get slow or crash after large uploads; reload between big steps. Uploaded packages persist server side; unsaved text does not.

### 4. What's New

From the submission's Store listings section, open every listing language (en-us, zh-cn, zh-tw, zh-hk, ja, fr-fr, de-de, es-es, es-mx, pt-br, ko-kr, it-it, ru-ru), put the text into "What's new in this version" and Save. Listing URLs take `listings?languageid=<id>&languagecode=<code>`; the IDs are en-us 4, zh-cn 5, zh-tw 88, zh-hk 43, ja 12, fr-fr 19, de-de 14, es-es 15, es-mx 66, pt-br 74, ko-kr 61, it-it 59, ru-ru 21. Change no other listing field.

### 5. Submit

Back on the submission overview, every section should read complete. "Submit for certification" only reacts to a coordinate click (a ref click on its wrapper does nothing), so take a screenshot and click the button itself. A feedback survey may pop up afterwards; close it without answering. Confirm the overview shows the submission in certification and save a screenshot. Certification usually finishes within hours and the update goes live automatically.
