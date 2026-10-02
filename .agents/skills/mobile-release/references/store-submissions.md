# Mobile store submissions

Store mode only. CI uploads both binaries (`eas submit`); you submit them for review. Get the What's New text for every locale from `release-notes.md` first.

## App Store (iOS)

The app record `6739802604` ("Folo - AI RSS Reader", bundle ID `is.follow`) holds both the iOS and the macOS versions. Use `asc` (App Store Connect API, keychain profile already configured) for every step it supports, and App Store Connect in Chrome for the final look and for anything the API cannot do. Pipe JSON output with `2>/dev/null`; `asc` prints notices on stderr.

### 1. Make sure the build arrived

In the production iOS run, the step "Submit to App Store" (`eas submit --platform ios`) must have succeeded. EAS raises the build number remotely (`appVersionSource: remote`, `autoIncrement`). Processing in App Store Connect takes 5–30 minutes; wait in the background:

```bash
for i in $(seq 1 60); do
  line=$(asc builds list --app 6739802604 --platform IOS --version "$VERSION" --processing-state all --output json 2>/dev/null \
    | jq -r '.data[0] | [.id, .attributes.version, .attributes.processingState] | @tsv')
  echo "$line"; case "$line" in *VALID*|*FAILED*|*INVALID*) break ;; esac; sleep 60
done
```

`.attributes.version` is the build number. `VALID` means ready (record `BUILD_ID`); `FAILED` or `INVALID` means stop and report. `ITSAppUsesNonExemptEncryption` is false, so no export compliance question is expected.

### 2. Prepare the version

```bash
asc versions list --app 6739802604 --platform IOS --output json 2>/dev/null \
  | jq -r '.data[] | [.id, .attributes.versionString, (.attributes.appVersionState // .attributes.appStoreState)] | @tsv' | head -5
```

- An editable version exists (`PREPARE_FOR_SUBMISSION`, `DEVELOPER_REJECTED`, `REJECTED`, `METADATA_REJECTED`) with another version string: rename it, which keeps its prepared metadata and screenshots: `asc versions update --version-id <id> --version "$VERSION"`.
- None exists: `asc versions create --app 6739802604 --platform IOS --version "$VERSION" --copy-metadata-from "<live iOS version>" --exclude-fields whatsNew --release-type AFTER_APPROVAL`.
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
asc validate --app 6739802604 --version-id "$VERSION_ID" --platform IOS --output table
asc review submit --app 6739802604 --platform IOS --version-id "$VERSION_ID" --build-id "$BUILD_ID" --dry-run
asc review submit --app 6739802604 --platform IOS --version-id "$VERSION_ID" --build-id "$BUILD_ID" --confirm
```

Before the submit, the only blocking finding should be "no build attached" (the submit attaches it). Subscription promotional image warnings and the App Privacy info line are normal. Fix anything else, or ask when the fix is not a What's New or build matter.

### 5. Confirm

```bash
asc versions view --version-id "$VERSION_ID" --include-build --include-submission --output json 2>/dev/null \
  | jq '{state, version: .versionString, build: .buildVersion}'
```

`asc versions view` prints a flat object. Expect `WAITING_FOR_REVIEW` and the new build number. Then open `https://appstoreconnect.apple.com/apps/6739802604/distribution/ios/version/inflight` in Chrome, check the status reads "Waiting for Review" with the right build, and save a screenshot for the report. If App Store Connect shows a banner the API could not handle (new agreements, compliance or declaration questions), agreements go to the user; answer questions only when the previous submission's answers clearly apply, otherwise ask.

## Google Play

Play Console runs in the user's Chrome under the Google account `diygod@rss3.io`: developer "Natural Selection Labs" (`8780622123419253259`), app Folo `is.follow` (`4975311879521237862`). Managed publishing is off, so approved changes go live by themselves.

Other Google accounts are signed in to the same Chrome. `i@diygod.cc` has no developer account (never click "Create developer account"), and `diygodcc@gmail.com` belongs to the closed developer account "DIYgod". The `/u/<n>/` index in console URLs depends on the Chrome account order, so start from the account chooser:

```
https://accounts.google.com/AccountChooser?continue=https%3A%2F%2Fplay.google.com%2Fconsole%2Fdevelopers%2F8780622123419253259%2Fapp%2F4975311879521237862%2Fapp-dashboard
```

Pick `diygod@rss3.io` (a ref click on the entry may not navigate; click its coordinates). If Google asks to sign in again it may start with a passkey challenge (`challenge/pk`); choose "Try another way" and the password, then use 1Password as in `browser-and-credentials.md`.

### 1. Make sure the bundle arrived

The production Android run's step "Submit to Google Play" (`eas submit --platform android`, `releaseStatus: draft`, default internal track) must have succeeded. It leaves a draft release with the new app bundle on the Internal testing track. Confirm the bundle (version name = new version, a new version code) under Test and release → Internal testing, or in the app bundle library.

### 2. Create the production release

1. Test and release → Production → "Create new release".
2. App bundles: "Add from library", pick the new version code, "Add to release". Keep the generated release name.
3. Release notes: one block per Google Play language with the fixed text from `release-notes.md`:
   ```
   <en-US>
   Bug fixes and improvements.
   </en-US>
   <zh-CN>
   错误修复和改进。
   </zh-CN>
   …
   ```
4. "Next". On the review page fix every error; compare warnings with the previous production release, where the usual ones (for example a missing deobfuscation file) also appeared.
5. Roll out to 100% unless the previous production release used a staged rollout; then match it.
6. Save, open Publishing overview and "Send N changes for review", then confirm. If the console offers "Start rollout to Production" instead, use that.

Leave the internal testing draft alone, and don't touch the store listing, pricing, content rating or Data safety. A required new declaration or policy form: stop and ask.

### 3. Confirm

Publishing overview lists the changes as in review, and the Production page shows the new release with the right version code. Save a screenshot for the report. The page slows down over long sessions; reload it if it stops responding.
