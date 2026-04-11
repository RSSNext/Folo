# Desktop OTA Unification Design

## Summary

Extend `apps/ota` from a mobile-only OTA service into the single update source of truth for:

- mobile OTA and binary update policy
- new desktop OTA and direct binary update policy

The existing desktop update routes in `follow-server` remain unchanged and continue serving old desktop clients. This design only migrates the new desktop client onto `apps/ota`.

The desktop design must stay close to the mobile model:

- file-driven release intent with `release-plan.json` and `release.json`
- `manifest` for downloadable update payloads
- `policy` for binary upgrade decisions
- explicit `runtimeVersion` compatibility instead of `mainHash`

Desktop OTA mode must publish both:

- a renderer OTA payload for installed users
- the latest direct-download installer assets for new users and direct-channel full upgrades

## Goals

- Keep `apps/ota` as the only update truth source for mobile and the new desktop client
- Keep `follow-server` untouched so old desktop clients remain fully compatible
- Remove `mainHash` from desktop OTA compatibility decisions
- Align desktop release orchestration with the new mobile `release-plan.json` and `release.json` workflow
- Support direct, Mac App Store, and Microsoft Store desktop distributions with different binary-policy timing
- Allow a desktop OTA release to publish both renderer OTA data and direct installer data
- Preserve a simple, auditable, repo-native release workflow driven by checked-in JSON config

## Non-Goals

- Migrating old desktop clients away from `follow-server`
- Replacing existing `follow-server` desktop YAML routes
- Auto-detecting App Store or Microsoft Store review completion from external APIs
- Shipping native code through OTA payloads
- Introducing staged rollout percentages in the first version

## Constraints

- `follow-server` must not be modified
- The new desktop client should use only `X-App-*` headers when talking to `apps/ota`
- Desktop distribution must be inferred from the existing `X-App-Platform` values in `packages/internal/utils/src/headers.ts`
- Desktop OTA compatibility must use explicit `runtimeVersion`
- If the desktop client omits `X-App-Runtime-Version`, the server must treat `X-App-Version` as the runtime version

## Key Decisions

### 1. Service Ownership

`apps/ota` owns update truth for:

- mobile
- the new desktop client

`follow-server` remains a legacy compatibility service for old desktop clients only.

### 2. Desktop Compatibility Model

Desktop stops using `mainHash` as the OTA compatibility key.

Desktop uses:

- `installedBinaryVersion`: the currently installed desktop app version
- `runtimeVersion`: the compatibility line for renderer OTA
- `rendererVersion`: the currently installed renderer version

Default rule:

- `runtimeVersion = installedBinaryVersion`

This matches the mobile mental model much better and removes the hidden compatibility semantics of `mainHash`.

### 3. File-Driven Release Intent

Desktop adopts the same workflow shape as mobile:

- `apps/desktop/release-plan.json` expresses the next intended release action
- `apps/desktop/release.json` records the resolved config for the actual tagged release

Release automation must read `release.json`, not ad-hoc workflow inputs, when deciding what to publish.

### 4. Desktop Release Modes

Desktop supports three modes:

- `build`
- `ota`
- `binary-policy`

Definitions:

- `build`: publish direct installer assets only
- `ota`: publish renderer OTA assets and direct installer assets together
- `binary-policy`: publish binary upgrade policy metadata only, without rebuilding or re-uploading installers

### 5. Distribution Policy Granularity

Desktop binary policy must support per-distribution timing because MAS and MSS approvals are delayed and can complete at different times.

Supported desktop distributions:

- `direct`
- `mas`
- `mss`

Policy lookups must prefer distribution-specific policy and fall back to product-level policy if no distribution-specific record exists.

### 6. Release Kind Naming

The OTA metadata model should move from:

- `ota`
- `store`

to:

- `ota`
- `binary`

Compatibility rule:

- the Worker continues accepting legacy `store` metadata as an alias of `binary`

This keeps old mobile metadata working while giving desktop a more accurate name than `store`.

## Release Config Design

### Desktop `release-plan.json`

Suggested shape:

```json
{
  "mode": "build",
  "runtimeVersion": null,
  "channel": null,
  "distributions": [],
  "required": false,
  "message": null
}
```

Rules:

- `mode` is one of `build`, `ota`, `binary-policy`
- `runtimeVersion` is required for `ota`
- `runtimeVersion` must be `null` for `build` and `binary-policy`
- `channel` is required for `ota` and `binary-policy`
- `distributions` is required for `binary-policy`
- `required` and `message` only affect binary policy publication

Allowed desktop channels:

- `stable`
- `beta`
- `alpha`

`development` is not a release channel.

### Desktop `release.json`

Suggested shape:

```json
{
  "version": "1.6.1",
  "mode": "ota",
  "runtimeVersion": "1.6.0",
  "channel": "stable",
  "distributions": ["direct"],
  "required": false,
  "message": null
}
```

`release.json` is the source of truth consumed by CI for a tagged release.

### Workflow Resolution

Desktop should mirror the mobile workflow pattern:

- a desktop resolver script reads `apps/desktop/release.json`
- the resolver decides which workflow actions to trigger
- `tag.yml` dispatches build and OTA publication based on resolved outputs

This removes hand-entered release parameters from normal release execution.

## OTA Metadata Model

Desktop release publication must produce a single machine-readable metadata file for `apps/ota`.

The file should stay named `ota-release.json` so the Worker sync path remains uniform across products.

Desktop `ota-release.json` must be able to describe:

- renderer OTA payloads
- direct binary installer payloads
- binary-policy-only publications

Suggested shape:

```json
{
  "schemaVersion": 2,
  "product": "desktop",
  "channel": "stable",
  "releaseVersion": "1.6.1",
  "releaseKind": "ota",
  "runtimeVersion": "1.6.0",
  "publishedAt": "2026-04-11T10:00:00Z",
  "git": {
    "tag": "desktop/v1.6.1",
    "commit": "abcdef123456"
  },
  "policy": {
    "required": false,
    "minSupportedBinaryVersion": "1.6.0",
    "message": null,
    "distributions": {
      "direct": {
        "downloadUrl": "https://example.com/Folo-1.6.1.dmg"
      }
    }
  },
  "desktop": {
    "renderer": {
      "version": "1.6.1",
      "commit": "abcdef123456",
      "launchAsset": {
        "path": "renderer/render-asset.tar.gz",
        "sha256": "0123...",
        "contentType": "application/gzip"
      },
      "assets": []
    },
    "app": {
      "platforms": {
        "macos": {
          "platform": "macos-x64",
          "releaseDate": "2026-04-11T10:00:00Z",
          "manifest": {
            "name": "latest-mac.yml",
            "downloadUrl": "https://example.com/latest-mac.yml"
          },
          "files": [
            {
              "filename": "Folo-1.6.1-macos-x64.zip",
              "sha512": "base64sha512",
              "size": 123456789,
              "downloadUrl": "https://example.com/Folo-1.6.1-macos-x64.zip"
            }
          ]
        }
      }
    }
  }
}
```

Notes:

- `schemaVersion: 2` avoids ambiguity with the existing mobile-only shape
- mobile can stay on the current shape or also migrate later if desired
- `releaseKind: "ota"` means renderer OTA data is eligible for `/manifest`
- `releaseKind: "binary"` means no OTA payload is served from `/manifest`, but the metadata can still update `/policy`
- `runtimeVersion` is required only for `releaseKind: "ota"` and should be `null` or omitted for `releaseKind: "binary"`
- direct binary payload data can be present in both `build` and `ota` modes

## Request Contract

### Shared Desktop Headers

The new desktop client uses only `X-App-*` headers when requesting `apps/ota`.

Required:

- `X-App-Platform`
- `X-App-Version`
- `X-App-Channel`

Optional:

- `X-App-Runtime-Version`
- `X-App-Renderer-Version`

### `X-App-Platform` Mapping

Map the existing platform header values to OTA routing dimensions:

- `desktop/macos/dmg` -> `platform=macos`, `distribution=direct`
- `desktop/macos/mas` -> `platform=macos`, `distribution=mas`
- `desktop/windows/exe` -> `platform=windows`, `distribution=direct`
- `desktop/windows/ms` -> `platform=windows`, `distribution=mss`
- `desktop/linux` -> `platform=linux`, `distribution=direct`
- `desktop/web` -> not eligible for desktop OTA or desktop binary policy

### Desktop Version Semantics

- `X-App-Version` is always the installed binary version
- `X-App-Runtime-Version` is the OTA compatibility key
- if `X-App-Runtime-Version` is absent, use `X-App-Version`
- `X-App-Renderer-Version` is used only to decide whether a renderer payload is newer than the installed renderer

## `GET /manifest`

### Responsibility

`/manifest` answers only:

- which compatible update payloads are currently available for this client

Desktop `manifest` can include:

- a renderer OTA payload
- a direct-channel full app payload

It must not make a final UX decision about store upgrade blocking. That remains the job of `/policy`.

### Desktop Response Shape

Suggested response:

```json
{
  "id": "uuid",
  "createdAt": "2026-04-11T10:00:00.000Z",
  "product": "desktop",
  "channel": "stable",
  "runtimeVersion": "1.6.0",
  "renderer": {
    "releaseVersion": "1.6.1",
    "version": "1.6.1",
    "commit": "abcdef1234",
    "launchAsset": {
      "key": "render-asset",
      "hash": "sha256-base64url",
      "fileExtension": ".tar.gz",
      "contentType": "application/gzip",
      "url": "https://ota.folo.is/assets/desktop/stable/1.6.0/1.6.1/windows/render-asset.tar.gz"
    },
    "assets": []
  },
  "app": {
    "releaseVersion": "1.6.1",
    "version": "1.6.1",
    "platform": "windows-x64",
    "releaseDate": "2026-04-11T10:00:00.000Z",
    "manifest": {
      "name": "latest.yml",
      "downloadUrl": "https://example.com/latest.yml"
    },
    "files": [
      {
        "filename": "Folo-1.6.1-windows-x64.exe",
        "sha512": "base64sha512",
        "size": 123456789,
        "downloadUrl": "https://example.com/Folo-1.6.1-windows-x64.exe"
      }
    ]
  }
}
```

### Desktop Manifest Rules

- `renderer` is returned only when:
  - a compatible desktop OTA release exists for `product + channel + runtimeVersion + platform`
  - the renderer payload version is newer than `X-App-Renderer-Version`
- `app` is returned only when:
  - the client distribution is `direct`
  - a newer compatible direct installer exists for the requested platform
- `mas` and `mss` must never receive a direct binary payload from `/manifest`
- if both `renderer` and `app` are absent, return `204`

### Client Priority

Desktop client priority should be:

1. apply `renderer` when available
2. otherwise offer `app` when available
3. use `/policy` separately for binary upgrade guidance and enforcement

## `GET /policy`

### Responsibility

`/policy` answers only:

- should this installed binary remain usable
- should the user be prompted to upgrade
- where should the user go to get the correct binary

### Desktop Response Shape

Suggested response:

```json
{
  "action": "none",
  "targetVersion": null,
  "message": null,
  "distribution": "direct",
  "downloadUrl": null,
  "storeUrl": null,
  "publishedAt": null
}
```

Example for an available direct binary upgrade:

```json
{
  "action": "prompt",
  "targetVersion": "1.6.1",
  "message": "A newer desktop version is available.",
  "distribution": "direct",
  "downloadUrl": "https://example.com/Folo-1.6.1.dmg",
  "storeUrl": null,
  "publishedAt": "2026-04-11T10:00:00.000Z"
}
```

### Policy Selection Rules

For desktop:

1. infer `distribution` from `X-App-Platform`
2. look up policy for `product + channel + distribution`
3. if none exists, fall back to `product + channel`
4. if no policy exists, return `none`

Action semantics:

- `none`: do not prompt or block
- `prompt`: recommend a binary upgrade but allow continued usage
- `block`: require a binary upgrade before continued usage

URL semantics:

- `direct` returns `downloadUrl`
- `mas` and `mss` return `storeUrl`

### Why Policy Is Explicitly Published

The service must not infer policy timing from GitHub release publication time.

Reason:

- MAS and MSS approval timing is asynchronous and unknown
- GitHub release publication can happen before a store binary is actually installable

Therefore binary policy becomes active only after an explicit `binary-policy` publication for the relevant distribution.

## Storage Model

### Release Records

Store parsed desktop and mobile release metadata under release-versioned keys.

Example:

- `release:desktop:1.6.1`
- `release:mobile:0.4.3`

### Latest OTA Pointers

Desktop OTA latest pointers should continue using product, channel, runtimeVersion, and platform.

Example:

- `latest:desktop:stable:1.6.0:windows`

### Binary Policy Keys

Add distribution-aware keys:

- `policy:<product>:<channel>`
- `policy:<product>:<channel>:<distribution>`

Desktop examples:

- `policy:desktop:stable:direct`
- `policy:desktop:stable:mas`
- `policy:desktop:stable:mss`

Mobile may continue using the product-level key initially and can adopt distribution-aware keys later.

## Publishing Flow

### Desktop `build`

- build and upload direct installer assets
- publish desktop binary metadata
- do not publish renderer OTA payload

### Desktop `ota`

- build and upload renderer OTA payload
- build and upload direct installer assets
- publish one metadata file that includes both renderer OTA and direct binary payload data

This keeps:

- existing users eligible for renderer OTA
- new users able to download the latest direct installer immediately

### Desktop `binary-policy`

- publish metadata only
- no installer rebuild
- no renderer OTA payload upload
- target one or more distributions explicitly

Examples:

- publish MAS policy after App Store approval
- publish MSS policy later when Microsoft Store approval completes

## Migration Plan

1. Introduce desktop release config files and resolver logic
2. Teach desktop publication flows to emit the new desktop `ota-release.json`
3. Extend `apps/ota` sync, storage, and selection logic to understand desktop metadata
4. Add desktop-aware `manifest` and `policy` routes to `apps/ota`
5. Update the new desktop client to use `apps/ota` `manifest + policy`
6. Keep old desktop clients on `follow-server` unchanged

## Validation Plan

### Unit Tests

- desktop release config validation and resolver behavior
- desktop metadata parsing
- runtimeVersion fallback from `X-App-Version`
- platform and distribution mapping from `X-App-Platform`
- policy selection and fallback
- renderer payload selection
- direct binary payload selection

### Worker Route Tests

- desktop direct request returns both `renderer` and `app` when both are available
- desktop direct request returns only `renderer` when no newer direct binary exists
- MAS and MSS requests never receive `app` payloads from `/manifest`
- desktop `policy` prefers distribution-specific records over generic records
- desktop `policy` returns `downloadUrl` for `direct`
- desktop `policy` returns `storeUrl` for `mas` and `mss`
- desktop `manifest` returns `204` when no compatible renderer or direct app payload exists

### Client Verification

- new desktop client applies renderer OTA when available
- new desktop client falls back to direct full app update when renderer OTA is unavailable
- MAS and MSS clients respect `prompt`
- MAS and MSS clients enforce `block`

## Open Risks

- Keeping the desktop metadata file backward-compatible enough for future mobile convergence requires careful schema versioning
- The desktop client must not assume that `app` payloads exist for store distributions
- Release automation must avoid publishing `binary-policy` too early for store channels

## Final Recommendation

Adopt `apps/ota` as the unified update truth source for mobile and the new desktop client, keep `follow-server` untouched for legacy desktop clients, remove `mainHash` from the compatibility model, and align desktop release orchestration with the new mobile file-driven release flow.

This provides one understandable model:

- `release-plan.json` defines intent
- `release.json` locks the tagged release config
- `/manifest` exposes compatible payload facts
- `/policy` exposes binary upgrade policy

It also preserves the direct desktop requirement that an OTA release should still publish the latest full installer.
