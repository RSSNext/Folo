# OTA Service Operations

This runbook covers release rollout verification and rollback for the `apps/ota` Cloudflare Worker.

## Scope

- GitHub Releases is the publishing source of truth.
- Cloudflare Worker, KV, and R2 are the delivery layer.
- Run Wrangler commands from `apps/ota`.
- The verified v1 routes are:
  - `GET /manifest`
  - `GET /assets/*`
  - `GET /policy`
  - `POST /internal/sync`
  - `GET /internal/health`

Desktop release automation is file-driven:

- `apps/desktop/release-plan.json`
- `apps/desktop/release.json`

Desktop release modes:

- `build`: publish direct installer assets only
- `ota`: publish renderer OTA assets and direct installer assets together

## Request Shape

`/manifest`:

- Requires `expo-platform` and `expo-runtime-version` headers.
- Accepts `expo-channel-name`; defaults to `production`.
- Accepts `product`; defaults to `mobile`.
- Returns `204` when no compatible OTA release exists.

Desktop `/manifest`:

- Uses `X-App-Platform`, `X-App-Version`, and `X-App-Channel`.
- Accepts optional `X-App-Runtime-Version`; defaults to `X-App-Version`.
- Accepts optional `X-App-Renderer-Version`.
- Returns desktop JSON with `renderer` and optional `app` payloads.
- Never returns direct `app` payloads for `mas` or `mss`.

`/policy`:

- Requires `platform` and `installedBinaryVersion`.
- Accepts `channel`; defaults to `production`.
- Accepts `product`; defaults to `mobile`.
- Detects the current live store version automatically:
  - `ios`: App Store lookup API
  - `android`: Google Play storefront
- Returns `none` or `prompt`.

Desktop `/policy`:

- Uses `X-App-Platform`, `X-App-Version`, and `X-App-Channel`.
- Resolves `distribution` from `X-App-Platform`.
- Detects the current live store version automatically for store distributions:
  - `mas`: Mac App Store storefront
  - `mss`: Microsoft Store public update service
- Returns `none` or `prompt` plus distribution-specific `storeUrl`.

Store version caching:

- Scheduled sync refreshes storefront versions into KV every 5 minutes.
- `POST /internal/sync` refreshes both GitHub release metadata and storefront versions.
- `/policy` reads cached storefront versions first.
- If a cache entry is missing, `/policy` fetches the storefront version once and backfills KV.

## Release Checklist

1. Confirm the Git tag exists for the target release, for example `mobile/v0.4.2`.
2. Confirm the GitHub Release contains both `ota-release.json` and `dist.tar.zst`.
3. Trigger an OTA sync after publishing or updating release assets.
4. Verify `/internal/health` reports a fresh `lastSuccessAt`.
5. Verify `/internal/health` reports a fresh `storeVersionLastSuccessAt`.
6. Verify `/manifest` resolves the expected `releaseVersion` for every target platform.
7. Download the returned launch asset URL and confirm it is reachable.
8. Verify `/policy` returns the expected action for the current installed version and storefront.
9. Run the automated OTA and mobile verification commands before closing the rollout.

## Rollback Checklist

1. Identify the last known good OTA release version for the affected `channel`, `runtimeVersion`, and platform set.
2. Read the current KV pointers before changing anything.
3. Overwrite the affected `latest:<product>:<channel>:<runtimeVersion>:<platform>` keys with the previous good `releaseVersion`.
4. Re-run the manual verification commands for `/manifest` and `/policy`.
5. Correct the GitHub Release source of truth before the next sync.

## Verified v1 Limitation

Rollback by KV pointer edit is only a temporary mitigation in the current implementation.

The sync job always promotes the highest compatible `releaseVersion` from GitHub Releases. If the bad release still exists as a valid published source, the next scheduled or manual sync can point `latest:*` back to the bad version.

Do not rely on KV edits alone. Before the next sync, either:

- remove or invalidate the bad OTA release assets from GitHub Releases, or
- publish a newer corrective OTA release on the same `runtimeVersion`.

Hard freeze and disable flags are not implemented in the verified v1 Worker yet.

## Environment Variables

Set these before running the manual checks:

```bash
export OTA_BASE_URL="https://ota.folo.is"
export OTA_PRODUCT="mobile"
export OTA_PLATFORM="ios"
export OTA_CHANNEL="production"
export OTA_RUNTIME_VERSION="0.4.1"
export OTA_INSTALLED_BINARY_VERSION="0.4.1"
export OTA_DESKTOP_PLATFORM="desktop/windows/exe"
export OTA_RELEASE_VERSION="0.4.2"
export OTA_SYNC_TOKEN_HEADER="x-ota-sync-token"
export OTA_SYNC_TOKEN="<secret>"
export OTA_GOOD_RELEASE_VERSION="0.4.1"
```

Production and development Workers must also provide an `OTA_CODE_SIGNING_PRIVATE_KEY` secret containing the PEM-encoded PKCS#8 private key that matches `apps/mobile/code-signing/certificate.pem`.

## Manual Verification Commands

Trigger a sync and inspect health:

```bash
OTA_BASE_URL="$OTA_BASE_URL" \
OTA_SYNC_TOKEN="$OTA_SYNC_TOKEN" \
OTA_SYNC_TOKEN_HEADER="$OTA_SYNC_TOKEN_HEADER" \
node ../../.github/scripts/trigger-ota-sync.mjs

curl --fail --silent --show-error \
  "$OTA_BASE_URL/internal/health"
```

Verify `/manifest` for iOS:

```bash
curl --fail --silent --show-error \
  -D /tmp/ota-manifest.headers \
  -H "expo-platform: ios" \
  -H "expo-runtime-version: $OTA_RUNTIME_VERSION" \
  -H "expo-channel-name: $OTA_CHANNEL" \
  "$OTA_BASE_URL/manifest?product=$OTA_PRODUCT" \
  | tee /tmp/ota-manifest.json

jq -r '.metadata.releaseVersion' /tmp/ota-manifest.json
jq -r '.launchAsset.url' /tmp/ota-manifest.json

curl --fail --silent --show-error \
  "$(jq -r '.launchAsset.url' /tmp/ota-manifest.json)" \
  -o /tmp/ota-launch-asset
```

Verify `/manifest` for Android:

```bash
curl --fail --silent --show-error \
  -H "expo-platform: android" \
  -H "expo-runtime-version: $OTA_RUNTIME_VERSION" \
  -H "expo-channel-name: $OTA_CHANNEL" \
  "$OTA_BASE_URL/manifest?product=$OTA_PRODUCT" \
  | jq -r '.metadata.releaseVersion'
```

Verify `/policy`:

```bash
curl --fail --silent --show-error \
  "$OTA_BASE_URL/policy?product=$OTA_PRODUCT&platform=$OTA_PLATFORM&channel=$OTA_CHANNEL&installedBinaryVersion=$OTA_INSTALLED_BINARY_VERSION" \
  | tee /tmp/ota-policy.json

jq . /tmp/ota-policy.json
```

Verify desktop `/manifest` for a direct Windows build:

```bash
curl --fail --silent --show-error \
  -H "X-App-Platform: $OTA_DESKTOP_PLATFORM" \
  -H "X-App-Version: 1.5.0" \
  -H "X-App-Runtime-Version: 1.5.0" \
  -H "X-App-Renderer-Version: 1.5.0" \
  -H "X-App-Channel: stable" \
  "$OTA_BASE_URL/manifest" \
  | tee /tmp/desktop-ota-manifest.json

jq . /tmp/desktop-ota-manifest.json
```

Verify desktop `/policy` for MAS:

```bash
curl --fail --silent --show-error \
  -H "X-App-Platform: desktop/macos/mas" \
  -H "X-App-Version: 1.5.0" \
  -H "X-App-Channel: stable" \
  "$OTA_BASE_URL/policy" \
  | tee /tmp/desktop-ota-policy.json

jq . /tmp/desktop-ota-policy.json
```

## Automated Verification Commands

Run these from the repository root:

```bash
pnpm --filter @follow/ota test
pnpm --filter @follow/ota typecheck
pnpm --dir apps/desktop/layer/main exec vitest run src/updater/api.test.ts src/updater/index.test.ts
pnpm --dir apps/desktop/layer/main typecheck
pnpm --filter @follow/mobile exec vitest run src/modules/ota/__tests__/client.test.ts src/modules/ota/__tests__/store.test.ts src/modules/ota/__tests__/provider.test.ts
pnpm --filter @follow/mobile typecheck
pnpm exec prettier --check .github/workflows/publish-ota.yml .github/workflows/tag.yml .github/scripts/trigger-ota-sync.mjs .github/scripts/trigger-ota-sync.test.ts
pnpm exec prettier --check .github/scripts/build-ota-release.mjs .github/scripts/build-ota-release.test.ts
```
