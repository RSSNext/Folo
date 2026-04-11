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

## Request Shape

`/manifest`:

- Requires `expo-platform` and `expo-runtime-version` headers.
- Accepts `expo-channel-name`; defaults to `production`.
- Accepts `product`; defaults to `mobile`.
- Returns `204` when no compatible OTA release exists.

`/policy`:

- Requires `installedBinaryVersion`.
- Accepts `channel`; defaults to `production`.
- Accepts `product`; defaults to `mobile`.

## Release Checklist

1. Confirm the Git tag exists for the target release, for example `mobile/v0.4.2`.
2. Confirm the GitHub Release contains both `ota-release.json` and `dist.tar.zst`.
3. Trigger an OTA sync after publishing or updating release assets.
4. Verify `/internal/health` reports a fresh `lastSuccessAt`.
5. Verify `/manifest` resolves the expected `releaseVersion` for every target platform.
6. Download the returned launch asset URL and confirm it is reachable.
7. Verify `/policy` returns the expected action for the installed binary version.
8. Run the automated OTA and mobile verification commands before closing the rollout.

## Rollback Checklist

1. Identify the last known good OTA release version for the affected `channel`, `runtimeVersion`, and platform set.
2. Read the current KV pointers before changing anything.
3. Overwrite the affected `latest:<product>:<channel>:<runtimeVersion>:<platform>` keys with the previous good `releaseVersion`.
4. If the issue is a bad store policy release, overwrite `policy:<product>:<channel>` with the previous good store release record.
5. Re-run the manual verification commands for `/manifest` and `/policy`.
6. Correct the GitHub Release source of truth before the next sync.

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
export OTA_CHANNEL="production"
export OTA_RUNTIME_VERSION="0.4.1"
export OTA_INSTALLED_BINARY_VERSION="0.4.1"
export OTA_RELEASE_VERSION="0.4.2"
export OTA_SYNC_TOKEN_HEADER="x-ota-sync-token"
export OTA_SYNC_TOKEN="<secret>"
export OTA_GOOD_RELEASE_VERSION="0.4.1"
export OTA_GOOD_STORE_VERSION="0.4.1"
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
  "$OTA_BASE_URL/policy?product=$OTA_PRODUCT&channel=$OTA_CHANNEL&installedBinaryVersion=$OTA_INSTALLED_BINARY_VERSION" \
  | tee /tmp/ota-policy.json

jq . /tmp/ota-policy.json
```

## Manual Rollback Commands

Inspect current pointers:

```bash
pnpm exec wrangler kv key get "latest:$OTA_PRODUCT:$OTA_CHANNEL:$OTA_RUNTIME_VERSION:ios" \
  --binding OTA_KV \
  --remote \
  --text

pnpm exec wrangler kv key get "latest:$OTA_PRODUCT:$OTA_CHANNEL:$OTA_RUNTIME_VERSION:android" \
  --binding OTA_KV \
  --remote \
  --text
```

Rollback OTA pointers to the previous good release:

```bash
pnpm exec wrangler kv key put "latest:$OTA_PRODUCT:$OTA_CHANNEL:$OTA_RUNTIME_VERSION:ios" \
  "{\"releaseVersion\":\"$OTA_GOOD_RELEASE_VERSION\"}" \
  --binding OTA_KV \
  --remote

pnpm exec wrangler kv key put "latest:$OTA_PRODUCT:$OTA_CHANNEL:$OTA_RUNTIME_VERSION:android" \
  "{\"releaseVersion\":\"$OTA_GOOD_RELEASE_VERSION\"}" \
  --binding OTA_KV \
  --remote
```

Rollback the store policy pointer:

```bash
pnpm exec wrangler kv key get "release:$OTA_PRODUCT:$OTA_GOOD_STORE_VERSION" \
  --binding OTA_KV \
  --remote \
  --text \
  > /tmp/ota-good-store-release.json

pnpm exec wrangler kv key put "policy:$OTA_PRODUCT:$OTA_CHANNEL" \
  --path /tmp/ota-good-store-release.json \
  --binding OTA_KV \
  --remote
```

## Automated Verification Commands

Run these from the repository root:

```bash
pnpm --filter @follow/ota test
pnpm --filter @follow/ota typecheck
pnpm --filter @follow/mobile exec vitest run src/modules/ota/__tests__/client.test.ts src/modules/ota/__tests__/store.test.ts src/modules/ota/__tests__/provider.test.ts
pnpm --filter @follow/mobile typecheck
pnpm exec prettier --check .github/workflows/publish-ota.yml .github/workflows/tag.yml .github/scripts/trigger-ota-sync.mjs .github/scripts/trigger-ota-sync.test.ts
pnpm exec prettier --check .github/scripts/build-ota-release.mjs .github/scripts/build-ota-release.test.ts
```
