# OTA Service Design

## Summary

Build a standalone OTA service in `apps/ota` that serves mobile updates through Expo Updates with a custom backend hosted on Cloudflare Workers.

GitHub Releases is the publishing source of truth. Cloudflare is the delivery layer.

The service must:

- support Expo mobile OTA without Expo paid cloud services
- allow future desktop update logic to live in the same service
- deliver JavaScript and static asset updates only
- preserve a simple release version line using plain `x.y.z`
- support both OTA releases and store-required releases

## Goals

- Keep release management simple by using a single public version line such as `0.4.1`, `0.4.2`, `0.4.3`
- Avoid suffix-based versioning such as `+ota.1` or `-ota.1`
- Use GitHub Releases to declare what is published
- Use Cloudflare R2 and Workers for stable update delivery
- Enforce native compatibility through `runtimeVersion`
- Allow per-release policy: some releases are OTA, some require full store update
- Integrate with the existing monorepo and current Cloudflare deployment patterns

## Non-Goals

- Shipping native code through OTA
- Replacing App Store or Play Store distribution for native changes
- Building a full release dashboard in the first version
- Supporting advanced staged rollouts in the first version

## Key Decisions

### 1. Service Placement

Create a standalone service in `apps/ota`.

This service name is intentionally product-agnostic so future desktop update logic can live in the same application.

### 2. Infrastructure Model

Use:

- Cloudflare Worker for routing, policy evaluation, manifest generation, and sync orchestration
- Cloudflare R2 for storing delivered bundles and assets
- Cloudflare KV for lightweight release index, latest pointers, ETag cache, and sync state
- Cloudflare Cron Triggers for periodic GitHub Releases sync

Do not use D1 in the first version. KV is sufficient for the initial read-heavy latest-release lookup model.

### 3. Publishing Source of Truth

GitHub Releases is the publishing source of truth.

Each release must upload:

- `ota-release.json`
- `dist.tar.zst`

`ota-release.json` is the only machine-readable metadata file trusted by the OTA service.

`dist.tar.zst` is the exported update payload archive that will be mirrored into R2.

### 4. Delivery Source

Clients must download bundles and assets from Cloudflare R2 through Worker-controlled URLs, not directly from GitHub assets.

GitHub remains the publication source. Cloudflare becomes the delivery source.

### 5. Version Strategy

Keep public versions as plain `x.y.z` only.

Examples:

- `0.4.1` store release
- `0.4.2` OTA release
- `0.4.3` store release
- `0.4.4` OTA release

Do not introduce OTA suffixes or extra numbering.

This design separates:

- `releaseVersion`: the version published to GitHub Releases, always plain `x.y.z`
- `releaseKind`: `store` or `ota`
- `runtimeVersion`: the native compatibility boundary used by Expo Updates

Each `releaseVersion` is unique and maps to exactly one `releaseKind`.

Rule:

- `releaseVersion` increases on every release
- `runtimeVersion` changes only when a new store binary is shipped
- OTA releases keep the current binary-compatible `runtimeVersion`

Example:

- release `0.4.1`, `releaseKind=store`, `runtimeVersion=0.4.1`
- release `0.4.2`, `releaseKind=ota`, `runtimeVersion=0.4.1`
- release `0.4.3`, `releaseKind=store`, `runtimeVersion=0.4.3`
- release `0.4.4`, `releaseKind=ota`, `runtimeVersion=0.4.3`

This allows a `0.4.1` installed binary to receive OTA `0.4.2` while preserving strict native compatibility.

## Release Metadata

Each GitHub Release must include an `ota-release.json` file with a schema similar to:

```json
{
  "schemaVersion": 1,
  "product": "mobile",
  "channel": "production",
  "releaseVersion": "0.4.2",
  "releaseKind": "ota",
  "runtimeVersion": "0.4.1",
  "publishedAt": "2026-04-10T12:00:00Z",
  "git": {
    "tag": "v0.4.2",
    "commit": "abcdef123456"
  },
  "policy": {
    "storeRequired": false,
    "minSupportedBinaryVersion": "0.4.1",
    "message": null
  },
  "platforms": {
    "ios": {
      "launchAsset": {
        "path": "bundles/ios-main.js",
        "sha256": "...",
        "contentType": "application/javascript"
      },
      "assets": [
        {
          "path": "assets/xxx.png",
          "sha256": "...",
          "contentType": "image/png"
        }
      ]
    },
    "android": {
      "launchAsset": {
        "path": "bundles/android-main.js",
        "sha256": "...",
        "contentType": "application/javascript"
      },
      "assets": []
    }
  }
}
```

Required semantics:

- `product` supports future values such as `desktop`
- `channel` supports `production`, `preview`, and future environments
- `releaseKind=ota` means `/manifest` may serve this release
- `releaseKind=store` means `/manifest` must not serve it as an OTA payload
- `runtimeVersion` is the Expo Updates compatibility key

## Client Update Decision Model

### OTA manifest lookup

The client sends an Expo Updates request to the custom server with at least:

- platform
- runtime version
- channel

The Worker selects a release using:

- exact `product` match
- exact `channel` match
- exact `runtimeVersion` match
- exact `platform` availability
- `releaseKind=ota`
- highest compatible `releaseVersion` using semantic version ordering

If no compatible OTA release exists, the service returns no update.

### Store update policy lookup

The mobile app also calls a separate `/policy` endpoint.

This endpoint determines whether the current installed binary must update through the store. This logic is independent from Expo Updates manifest resolution.

The `/policy` response should support states such as:

- no action
- soft prompt
- blocking required store update

This is needed because Expo Updates only solves OTA delivery, not store-update enforcement UX.

## Cloudflare Responsibilities

### Worker

`apps/ota` Worker responsibilities:

- serve Expo Updates manifest responses
- serve R2-backed assets
- expose update policy responses
- sync GitHub Releases into internal index and R2
- expose minimal internal health and sync endpoints

### KV

KV stores:

- parsed release records
- latest compatible release pointers
- sync status
- cached GitHub ETag values
- simple release disable or freeze flags

Suggested keys:

- `release:<product>:<releaseVersion>`
- `latest:<product>:<channel>:<runtimeVersion>:<platform>`
- `policy:<product>:<channel>`
- `github:etag:releases`
- `sync:last-success-at`

### R2

R2 stores exported update payloads after sync from GitHub.

Suggested object layout:

```text
<product>/<channel>/<runtimeVersion>/<releaseVersion>/<platform>/bundles/...
<product>/<channel>/<runtimeVersion>/<releaseVersion>/<platform>/assets/...
```

Example:

```text
mobile/production/0.4.1/0.4.2/ios/bundles/ios-main.js
mobile/production/0.4.1/0.4.2/ios/assets/asset-1.png
```

### Cron

Use Cron to poll GitHub Releases on a short interval, for example every 5 minutes.

Also expose a manual sync endpoint so CI can trigger immediate refresh after publishing a release.

## Worker Routes

Initial route set:

- `GET /manifest`
- `GET /assets/*`
- `GET /policy`
- `POST /internal/sync`
- `GET /internal/health`

### `GET /manifest`

Returns an Expo Updates manifest for the latest compatible OTA release.

This route must:

- read client headers
- find the latest matching OTA release from KV
- generate manifest JSON
- rewrite asset URLs to Worker-served or R2-backed URLs
- attach required Expo protocol headers
- attach code signing when enabled

### `GET /assets/*`

Streams bundle and asset files from R2.

This route should set strong cache headers and content type based on stored metadata.

### `GET /policy`

Returns release policy for the installed app version, channel, and platform.

This route powers store-required update UX and future release notices.

### `POST /internal/sync`

Triggers a GitHub Releases sync.

This endpoint should be protected by a secret token header.

### `GET /internal/health`

Returns diagnostic information for sync health and latest release pointers.

## GitHub Release Sync Flow

1. Cron or CI calls sync
2. Worker requests GitHub Releases API with conditional headers when possible
3. Worker filters releases that include both `ota-release.json` and `dist.tar.zst`
4. Worker parses and validates `ota-release.json`
5. Worker uploads extracted payload files into R2 if not already mirrored
6. Worker stores parsed release metadata in KV
7. Worker updates latest pointers for compatible OTA releases
8. Worker updates policy records for store-required releases

## Mobile Build and Publish Flow

### Release publishing

Keep the current release version line simple and monotonic.

For each release:

1. choose next `x.y.z`
2. decide whether the release is `store` or `ota`
3. generate exported payload for mobile
4. publish GitHub Release `vX.Y.Z`
5. upload `ota-release.json` and `dist.tar.zst`
6. trigger OTA sync

The same `x.y.z` version must not be published once as `store` and again as `ota`.

### OTA export

Use Expo CLI export from `apps/mobile`.

The export step generates JavaScript bundles and static assets from the existing mobile entrypoint.

The archive content is mirrored to R2. The metadata file declares which release is OTA-compatible and which runtime it targets.

## Mobile App Integration

### App config

In `apps/mobile/app.config.ts`:

- enable `updates.url` to point to the OTA Worker
- keep code signing enabled
- keep `runtimeVersion` explicit

`runtimeVersion` should remain tied to the currently installed compatible binary version, not to every OTA release.

### Runtime behavior

Add a top-level OTA provider in the mobile app root.

The provider should:

- check for updates after launch in the background
- download updates silently
- apply them on next launch by default
- expose debug actions for manual check and immediate reload in non-production builds

The first version should avoid forced reload immediately on launch.

### Store policy behavior

At startup, the app should also call `/policy`.

For `store-required` responses, the app decides whether to:

- show a non-blocking prompt
- show a strong prompt
- block further usage until the store update is installed

The first version can support soft prompt and blocking prompt only.

## Rollback and Freeze Strategy

### Soft rollback

Move the latest KV pointer back to the previous compatible OTA release.

### Hard freeze

Mark a release as disabled in KV so it is never returned even if it is otherwise compatible.

These controls must be available without deleting GitHub Releases.

## Error Handling

The service must handle:

- malformed or missing `ota-release.json`
- missing payload archive
- R2 sync failure
- GitHub API rate limiting
- stale cached release metadata
- unsupported platform or runtime requests

Behavior rules:

- never serve partially mirrored releases
- only expose a release after metadata and payload sync both succeed
- if sync fails, keep serving the previous latest compatible release
- prefer stale-successful metadata over broken fresh metadata

## Security

- Sign OTA manifests using Expo Updates code signing
- Keep the signing private key outside the repository
- Keep only the public certificate in the repo
- Protect internal sync endpoints with a shared secret
- Validate uploaded metadata schema strictly before indexing it

## Testing Strategy

### Unit tests

- metadata schema validation
- release selection logic
- policy evaluation logic
- manifest generation logic

### Integration tests

- sync a mocked GitHub Release into KV and R2
- request `/manifest` for different channel and runtime combinations
- request `/policy` for OTA and store-required releases

### End-to-end validation

- publish a preview OTA release
- verify iOS preview binary downloads the update
- verify Android preview binary downloads the update
- verify store-required policy blocks or prompts correctly

## Initial Implementation Scope

Phase 1:

- `apps/ota` Worker
- R2 + KV bindings
- GitHub Release sync
- `/manifest`, `/assets/*`, `/policy`
- mobile app config integration
- background OTA check
- basic debug actions
- rollback by KV pointer edit

Phase 2:

- better admin controls
- staged rollout support
- richer policy targeting
- desktop integration

## Open Constraints to Preserve

- Conversation can be in Chinese, but the engineering artifact remains English
- No Expo paid cloud update service
- No suffix-based release versioning
- GitHub Release versions remain plain `x.y.z`
- OTA and store releases share the same version line
- Some releases may be OTA while others may require store update
- Future desktop support must fit the same service

## Recommended Next Step

After this design is approved, write an implementation plan for:

- `apps/ota` project scaffolding
- Worker data model and sync logic
- mobile app config and provider integration
- GitHub Actions OTA publish workflow
- verification and rollback operations
