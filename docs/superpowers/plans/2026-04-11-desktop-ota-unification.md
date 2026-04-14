# Desktop OTA Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the new desktop client onto `apps/ota`, keep old desktop clients on `follow-server`, replace desktop OTA `mainHash` compatibility with explicit `runtimeVersion`, and align desktop release orchestration with the mobile `release-plan.json` and `release.json` workflow.

**Architecture:** Desktop release intent becomes file-driven with `apps/desktop/release-plan.json` and `apps/desktop/release.json`, just like mobile. Desktop release automation produces a new `ota-release.json` schema that `apps/ota` can sync and index for renderer OTA payloads, direct installer payloads, and distribution-specific binary policies, while still publishing the legacy desktop YAML assets so old clients and `follow-server` continue working unchanged. The new desktop updater fetches `manifest` and `policy` from `apps/ota` with `X-App-*` headers, applies renderer OTA when available, falls back to direct full-app updates for `direct` builds, and uses `policy` for `direct`, `mas`, and `mss` binary upgrade guidance.

**Tech Stack:** GitHub Actions, Node.js scripts, nbump, Electron Forge, electron-updater, Cloudflare Workers, Hono, KV, R2, Zod, Vitest, TypeScript

---

## File Structure

### New files

- `apps/desktop/release-plan.json`
  Default desktop release intent config for the next version bump.
- `apps/desktop/release.json`
  Resolved desktop release config committed with the release PR.
- `apps/desktop/scripts/apply-release-config.impl.ts`
  Desktop release-plan reader, validator, and `release.json` writer.
- `apps/desktop/scripts/apply-release-config.ts`
  Small CLI wrapper for the desktop release-config writer.
- `apps/desktop/scripts/apply-release-config.test.ts`
  Desktop release-config writer tests.
- `.github/scripts/resolve-desktop-release-config.mjs`
  Reads `apps/desktop/release.json` and exposes workflow outputs for desktop release orchestration.
- `.github/scripts/resolve-desktop-release-config.test.ts`
  Resolver tests for `build`, `ota`, and `binary-policy`.
- `apps/ota/src/lib/request.ts`
  Shared desktop/mobile request parsing for route handlers.
- `apps/ota/src/lib/desktop.ts`
  Desktop manifest and policy response builders.
- `apps/desktop/layer/main/src/updater/types.ts`
  Local typed models for `apps/ota` desktop `manifest` and `policy` responses.
- `apps/desktop/layer/main/src/updater/api.test.ts`
  Desktop OTA HTTP client tests for headers and response parsing.
- `apps/desktop/layer/main/src/updater/index.test.ts`
  Desktop updater behavior tests for renderer/direct/policy decisions.

### Modified files

- `apps/desktop/bump.config.ts`
  Run the new desktop release-config writer during version bumps and stage `release.json` / `release-plan.json`.
- `apps/desktop/package.json`
  Add a desktop release-config script, persist `runtimeVersion`, and keep the legacy `update:main-hash` script that old desktop releases still need.
- `.github/workflows/tag.yml`
  Resolve desktop release mode from `apps/desktop/release.json` and dispatch direct builds, store builds, and metadata publication accordingly.
- `.github/workflows/build-desktop.yml`
  Read the resolved desktop release mode, generate desktop OTA metadata for `ota` mode, and upload `ota-release.json` plus `dist.tar.zst` with the existing desktop assets.
- `.github/workflows/publish-ota.yml`
  Generalize the metadata publish workflow so it can handle desktop `binary-policy` and mobile releases with the same script entrypoint.
- `.github/scripts/build-ota-release.mjs`
  Support both mobile and desktop metadata generation with desktop `build`, `ota`, and `binary-policy` modes.
- `.github/scripts/build-ota-release.test.ts`
  Cover schema version 2 desktop metadata, direct installer payloads, and binary-policy-only output.
- `packages/internal/shared/src/env.common.ts`
  Add a default OTA base URL for desktop.
- `packages/internal/shared/src/env.desktop.ts`
  Expose `VITE_OTA_URL` to desktop main and renderer code.
- `apps/ota/src/lib/schema.ts`
  Extend metadata schema to support desktop payloads, distribution-aware policy, and `binary` release kind while aliasing legacy `store`.
- `apps/ota/src/lib/constants.ts`
  Add distribution-aware policy key builders.
- `apps/ota/src/lib/kv.ts`
  Store and read distribution-aware policy records in addition to latest OTA pointers.
- `apps/ota/src/lib/sync.ts`
  Persist desktop metadata, mirror desktop renderer archives, and write policy keys for `direct`, `mas`, and `mss`.
- `apps/ota/src/lib/manifest.ts`
  Preserve mobile manifest generation and add desktop response assembly helpers.
- `apps/ota/src/lib/policy.ts`
  Generalize store-policy evaluation into binary-policy evaluation with distribution-aware URLs.
- `apps/ota/src/routes/manifest.ts`
  Continue serving mobile Expo manifests and add desktop `X-App-*` request handling.
- `apps/ota/src/routes/policy.ts`
  Continue serving mobile policy responses and add desktop policy responses keyed by `X-App-Platform`.
- `apps/ota/src/__tests__/schema.test.ts`
  Cover schema version 2 desktop metadata and legacy `store` alias parsing.
- `apps/ota/src/__tests__/sync.test.ts`
  Cover desktop sync, direct installer metadata persistence, and distribution-specific policy keys.
- `apps/ota/src/__tests__/manifest.test.ts`
  Cover desktop `manifest` response shapes for `direct`, `mas`, and `mss`.
- `apps/ota/src/__tests__/policy.test.ts`
  Cover distribution-aware `none`, `prompt`, and `block`.
- `apps/ota/README.md`
  Document the new desktop headers, desktop release modes, and distribution-aware binary policy behavior.
- `apps/desktop/layer/main/src/updater/api.ts`
  Replace `follow-server` update API calls with direct `apps/ota` `manifest` and `policy` fetchers.
- `apps/desktop/layer/main/src/updater/follow-update-provider.ts`
  Reuse the provider implementation for direct installer downloads, but feed it from the new desktop `app` payload instead of the old `follow-server` response.
- `apps/desktop/layer/main/src/updater/hot-updater.ts`
  Remove `mainHash` gating from the new updater path and rely on server-side `runtimeVersion` compatibility.
- `apps/desktop/layer/main/src/updater/index.ts`
  Swap `follow-server` decision handling for `apps/ota` `manifest + policy` handling.

## Task 1: Add Desktop Release Config Files and Workflow Resolver

**Files:**

- Create: `apps/desktop/release-plan.json`
- Create: `apps/desktop/release.json`
- Create: `apps/desktop/scripts/apply-release-config.impl.ts`
- Create: `apps/desktop/scripts/apply-release-config.ts`
- Create: `apps/desktop/scripts/apply-release-config.test.ts`
- Create: `.github/scripts/resolve-desktop-release-config.mjs`
- Create: `.github/scripts/resolve-desktop-release-config.test.ts`
- Modify: `apps/desktop/bump.config.ts`
- Modify: `apps/desktop/package.json`
- Modify: `.github/workflows/tag.yml`

- [ ] **Step 1: Write failing tests for desktop release config resolution**

```ts
import { mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "pathe"
import { describe, expect, it } from "vitest"

describe("applyDesktopReleaseConfig", () => {
  it("writes release.json for ota mode and resets release-plan.json", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "desktop-release-config-"))
    await writeFile(
      join(projectDir, "package.json"),
      `${JSON.stringify({ name: "Folo", version: "1.5.0" }, null, 2)}\n`,
      "utf8",
    )
    await writeFile(
      join(projectDir, "release-plan.json"),
      `${JSON.stringify(
        {
          mode: "ota",
          runtimeVersion: "1.5.0",
          channel: "stable",
          distributions: ["direct"],
          required: false,
          message: null,
        },
        null,
        2,
      )}\n`,
      "utf8",
    )

    const { applyReleaseConfig } = await import("./apply-release-config.impl.ts")
    await applyReleaseConfig({ projectDir, version: "1.5.1" })

    await expect(readFile(join(projectDir, "release.json"), "utf8")).resolves.toContain(
      `"mode": "ota"`,
    )
    await expect(readFile(join(projectDir, "release.json"), "utf8")).resolves.toContain(
      `"runtimeVersion": "1.5.0"`,
    )
    await expect(readFile(join(projectDir, "release-plan.json"), "utf8")).resolves.toContain(
      `"mode": "build"`,
    )
    await expect(readFile(join(projectDir, "package.json"), "utf8")).resolves.toContain(
      `"runtimeVersion": "1.5.0"`,
    )
  })
})
```

```ts
import { describe, expect, it } from "vitest"

describe("resolveDesktopReleaseConfig", () => {
  it("triggers direct and store builds for ota mode", async () => {
    const { resolveDesktopReleaseConfig } = await import("./resolve-desktop-release-config.mjs")

    expect(
      resolveDesktopReleaseConfig({
        releaseVersion: "v1.5.1",
        releaseConfig: {
          version: "1.5.1",
          mode: "ota",
          runtimeVersion: "1.5.0",
          channel: "stable",
          distributions: ["direct"],
          required: false,
          message: null,
        },
      }),
    ).toMatchObject({
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      triggerMetadataPublish: false,
      releaseKind: "ota",
      runtimeVersion: "1.5.0",
      channel: "stable",
    })
  })
})
```

- [ ] **Step 2: Run the new tests and verify they fail**

Run: `pnpm exec vitest run apps/desktop/scripts/apply-release-config.test.ts .github/scripts/resolve-desktop-release-config.test.ts`

Expected: FAIL because the desktop release-config files and resolver do not exist yet.

- [ ] **Step 3: Implement desktop release-plan defaults and the apply-release-config writer**

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

```ts
export interface DesktopReleasePlan {
  mode: "build" | "ota" | "binary-policy"
  runtimeVersion: string | null
  channel: "stable" | "beta" | "alpha" | null
  distributions: Array<"direct" | "mas" | "mss">
  required: boolean
  message: string | null
}

function validateDesktopReleasePlan(plan: DesktopReleasePlan) {
  if (plan.mode === "build") {
    if (plan.runtimeVersion !== null || plan.channel !== null) {
      throw new Error("desktop build mode must not set runtimeVersion or channel")
    }
    return
  }

  if (plan.mode === "ota") {
    if (!plan.runtimeVersion?.match(/^\d+\.\d+\.\d+$/)) {
      throw new Error("desktop ota mode requires a plain x.y.z runtimeVersion")
    }
    if (!plan.channel) {
      throw new Error("desktop ota mode requires a channel")
    }
    return
  }

  if (!plan.channel || plan.distributions.length === 0) {
    throw new Error("desktop binary-policy mode requires channel and distributions")
  }
}
```

```ts
const packageJsonPath = join(input.projectDir, "package.json")
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
packageJson.runtimeVersion = plan.mode === "ota" ? plan.runtimeVersion : input.version
await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")

await writeFile(
  releaseConfigPath,
  `${JSON.stringify({ version: input.version, ...plan }, null, 2)}\n`,
  "utf8",
)
await writeFile(releasePlanPath, `${JSON.stringify(createDefaultReleasePlan(), null, 2)}\n`, "utf8")
```

- [ ] **Step 4: Implement the desktop release resolver and wire the version bump flow**

```ts
export function resolveDesktopReleaseConfig(input) {
  const normalizedReleaseVersion = input.releaseVersion.replace(/^v/, "")
  const config = input.releaseConfig

  if (config.version !== normalizedReleaseVersion) {
    throw new Error(
      `apps/desktop/release.json version ${config.version} does not match release version ${normalizedReleaseVersion}.`,
    )
  }

  if (config.mode === "build") {
    return {
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      triggerMetadataPublish: false,
      releaseKind: null,
      runtimeVersion: null,
      channel: null,
      distributions: "",
      required: "",
      policyMessage: "",
    }
  }

  if (config.mode === "ota") {
    return {
      triggerDirectBuild: true,
      triggerStoreBuilds: true,
      triggerMetadataPublish: false,
      releaseKind: "ota",
      runtimeVersion: config.runtimeVersion,
      channel: config.channel,
      distributions: "direct",
      required: "false",
      policyMessage: "",
    }
  }

  return {
    triggerDirectBuild: false,
    triggerStoreBuilds: false,
    triggerMetadataPublish: true,
    releaseKind: "binary",
    runtimeVersion: null,
    channel: config.channel,
    distributions: config.distributions.join(","),
    required: String(config.required),
    policyMessage: config.message ?? "",
  }
}
```

```ts
trailing: [
  "tsx scripts/apply-release-config.ts ${NEW_VERSION}",
  "git add package.json",
  "git add release.json release-plan.json",
  "git checkout -b release/desktop/${NEW_VERSION}",
]
```

```yaml
- name: Resolve Desktop Release Config
  id: desktop_release_mode
  if: needs.create_tag.outputs.platform == 'desktop' && needs.create_tag.outputs.ref_name == 'main'
  env:
    RELEASE_VERSION: ${{ needs.create_tag.outputs.version }}
    RELEASE_CONFIG_PATH: apps/desktop/release.json
  run: node .github/scripts/resolve-desktop-release-config.mjs

- name: Trigger Desktop Tag Version Build
  if: needs.create_tag.outputs.platform == 'desktop' && needs.create_tag.outputs.ref_name == 'main' && steps.desktop_release_mode.outputs.triggerDirectBuild == 'true'
  uses: actions/github-script@v9
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    script: |
      await github.rest.actions.createWorkflowDispatch({
        owner: context.repo.owner,
        repo: context.repo.repo,
        workflow_id: "build-desktop.yml",
        ref: "main",
        inputs: {
          tag_version: "true",
          store: "false",
          release_version: "${{ needs.create_tag.outputs.version }}"
        }
      });
```

- [ ] **Step 5: Run the tests again and verify they pass**

Run: `pnpm exec vitest run apps/desktop/scripts/apply-release-config.test.ts .github/scripts/resolve-desktop-release-config.test.ts`

Expected: PASS with cases for `build`, `ota`, and `binary-policy`.

- [ ] **Step 6: Commit the release-config work**

Run:

```bash
git add \
  apps/desktop/release-plan.json \
  apps/desktop/release.json \
  apps/desktop/scripts/apply-release-config.impl.ts \
  apps/desktop/scripts/apply-release-config.ts \
  apps/desktop/scripts/apply-release-config.test.ts \
  .github/scripts/resolve-desktop-release-config.mjs \
  .github/scripts/resolve-desktop-release-config.test.ts \
  apps/desktop/bump.config.ts \
  apps/desktop/package.json \
  .github/workflows/tag.yml
git commit -m "feat(release): add desktop release config flow"
```

## Task 2: Extend the Metadata Builder and Desktop Release Workflow

**Files:**

- Modify: `.github/scripts/build-ota-release.mjs`
- Modify: `.github/scripts/build-ota-release.test.ts`
- Modify: `.github/workflows/build-desktop.yml`
- Modify: `.github/workflows/publish-ota.yml`

- [ ] **Step 1: Write failing tests for desktop OTA metadata generation**

```ts
it("builds schemaVersion 2 desktop ota metadata with renderer and direct app payloads", async () => {
  const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
  const projectDir = await mkdtemp(join(tmpdir(), "desktop-ota-build-"))

  await mkdir(join(projectDir, "dist"), { recursive: true })
  await mkdir(join(projectDir, "out", "make", "squirrel.windows", "x64"), { recursive: true })

  await writeFile(
    join(projectDir, "release.json"),
    `${JSON.stringify(
      {
        version: "1.5.1",
        mode: "ota",
        runtimeVersion: "1.5.0",
        channel: "stable",
        distributions: ["direct"],
        required: false,
        message: null,
      },
      null,
      2,
    )}\n`,
  )

  const result = await buildDesktopReleaseAssets({
    projectDir,
    owner: "RSSNext",
    repo: "Folo",
  })

  expect(result.otaMetadata.schemaVersion).toBe(2)
  expect(result.otaMetadata.releaseKind).toBe("ota")
  expect(result.otaMetadata.desktop.renderer.version).toBe("1.5.1")
  expect(result.otaMetadata.desktop.app.platforms.windows.files[0]?.downloadUrl).toContain(
    "/desktop/v1.5.1/",
  )
})
```

```ts
it("builds desktop binary-policy metadata without dist.tar.zst", async () => {
  const { buildDesktopReleaseAssets } = await import("./build-ota-release.mjs")
  const result = await buildDesktopReleaseAssets({
    projectDir,
    owner: "RSSNext",
    repo: "Folo",
  })

  expect(result.otaMetadata.releaseKind).toBe("binary")
  expect(result.archivePath).toBeNull()
})
```

- [ ] **Step 2: Run the metadata builder tests and verify they fail**

Run: `pnpm exec vitest run .github/scripts/build-ota-release.test.ts`

Expected: FAIL because the builder does not understand desktop release config or schema version 2 yet.

- [ ] **Step 3: Implement a desktop branch in `build-ota-release.mjs`**

```js
function buildGitHubAssetUrl({ owner, repo, tag, filename }) {
  return `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`
}

async function buildDesktopReleaseAssets({ projectDir, owner, repo }) {
  const releaseConfig = await readJson(join(projectDir, "release.json"))
  const packageJson = await readJson(join(projectDir, "package.json"))
  const releaseVersion = releaseConfig.version
  const tag = `desktop/v${releaseVersion}`

  if (releaseConfig.mode === "binary-policy") {
    return {
      otaMetadata: {
        schemaVersion: 2,
        product: "desktop",
        releaseVersion,
        releaseKind: "binary",
        runtimeVersion: null,
        channel: releaseConfig.channel,
        publishedAt: new Date().toISOString(),
        git: {
          tag,
          commit: execGit(["rev-parse", "HEAD"], REPO_ROOT),
        },
        policy: {
          required: releaseConfig.required,
          minSupportedBinaryVersion: packageJson.version,
          message: releaseConfig.message,
          distributions: Object.fromEntries(
            releaseConfig.distributions.map((distribution) => [distribution, {}]),
          ),
        },
        desktop: {
          renderer: null,
          app: null,
        },
      },
      archivePath: null,
    }
  }
}
```

```js
const latestYaml = yaml.load(
  await readFile(join(projectDir, "out", "make", "squirrel.windows", "x64", "latest.yml"), "utf8"),
)
const desktopMetadata = {
  schemaVersion: 2,
  product: "desktop",
  releaseVersion,
  releaseKind: releaseConfig.mode === "ota" ? "ota" : "binary",
  runtimeVersion: releaseConfig.mode === "ota" ? releaseConfig.runtimeVersion : null,
  channel: releaseConfig.mode === "ota" ? releaseConfig.channel : null,
  desktop: {
    renderer:
      releaseConfig.mode === "ota"
        ? {
            version: releaseVersion,
            commit: execGit(["rev-parse", "HEAD"], REPO_ROOT),
            launchAsset: await resolveAsset({ path: "renderer/render-asset.tar.gz" }),
            assets: [],
          }
        : null,
    app: {
      platforms: {
        windows: {
          platform: "windows-x64",
          releaseDate: latestYaml.releaseDate,
          manifest: {
            name: "latest.yml",
            downloadUrl: buildGitHubAssetUrl({ owner, repo, tag, filename: "latest.yml" }),
          },
          files: latestYaml.files.map((file) => ({
            filename: file.url,
            sha512: file.sha512,
            size: file.size,
            downloadUrl: buildGitHubAssetUrl({ owner, repo, tag, filename: file.url }),
          })),
        },
      },
    },
  },
}
```

- [ ] **Step 4: Generate metadata inside the desktop release workflow**

```yaml
on:
  workflow_dispatch:
    inputs:
      release_version:
        type: string
        description: "Resolved desktop version from release.json"
```

```yaml
- name: Resolve desktop release config
  if: env.RELEASE == 'true'
  id: desktop_release_mode
  env:
    RELEASE_VERSION: ${{ github.event.inputs.release_version }}
    RELEASE_CONFIG_PATH: apps/desktop/release.json
  run: node .github/scripts/resolve-desktop-release-config.mjs
```

```yaml
- name: Build desktop OTA metadata
  if: runner.os == 'Linux' && env.RELEASE == 'true' && steps.desktop_release_mode.outputs.release_kind == 'ota'
  working-directory: apps/desktop
  env:
    OTA_PRODUCT: desktop
    OTA_RELEASE_KIND: ota
    OTA_RUNTIME_VERSION: ${{ steps.desktop_release_mode.outputs.runtime_version }}
    OTA_CHANNEL: ${{ steps.desktop_release_mode.outputs.channel }}
    GITHUB_OWNER: ${{ github.repository_owner }}
    GITHUB_REPO: ${{ github.event.repository.name }}
  run: pnpm exec node ../../.github/scripts/build-ota-release.mjs
```

```yaml
files: |
  apps/desktop/out/make/**/Folo-*.dmg
  apps/desktop/out/make/**/Folo-*.zip
  apps/desktop/out/make/**/Folo-*.exe
  apps/desktop/out/make/**/Folo-*.AppImage
  apps/desktop/out/make/**/*.yml
  apps/desktop/dist/manifest.yml
  apps/desktop/dist/*.tar.gz
  apps/desktop/dist/ota-release.json
  apps/desktop/dist.tar.zst
```

```yaml
product:
  type: choice
  required: true
  options:
    - mobile
    - desktop
```

- [ ] **Step 5: Re-run the builder tests and check the updated workflows**

Run: `pnpm exec vitest run .github/scripts/build-ota-release.test.ts`

Expected: PASS with desktop `build`, `ota`, and `binary-policy` coverage.

Run: `pnpm exec prettier --check .github/workflows/build-desktop.yml .github/workflows/publish-ota.yml .github/scripts/build-ota-release.mjs`

Expected: PASS with no formatting changes required.

- [ ] **Step 6: Commit the metadata builder and workflow changes**

Run:

```bash
git add \
  .github/scripts/build-ota-release.mjs \
  .github/scripts/build-ota-release.test.ts \
  .github/workflows/build-desktop.yml \
  .github/workflows/publish-ota.yml
git commit -m "feat(ota): add desktop metadata publishing"
```

## Task 3: Extend `apps/ota` Schema, Storage, and Sync for Desktop

**Files:**

- Modify: `apps/ota/src/lib/schema.ts`
- Modify: `apps/ota/src/lib/constants.ts`
- Modify: `apps/ota/src/lib/kv.ts`
- Modify: `apps/ota/src/lib/policy.ts`
- Modify: `apps/ota/src/lib/sync.ts`
- Modify: `apps/ota/src/__tests__/schema.test.ts`
- Modify: `apps/ota/src/__tests__/policy.test.ts`
- Modify: `apps/ota/src/__tests__/sync.test.ts`

- [ ] **Step 1: Write failing worker tests for desktop schema and distribution-aware policy keys**

```ts
it("accepts desktop schemaVersion 2 ota metadata and legacy store aliases", () => {
  const parsed = otaReleaseSchema.parse({
    schemaVersion: 2,
    product: "desktop",
    channel: "stable",
    releaseVersion: "1.5.1",
    releaseKind: "binary",
    runtimeVersion: null,
    publishedAt: "2026-04-11T10:00:00Z",
    git: {
      tag: "desktop/v1.5.1",
      commit: "abcdef1234567890",
    },
    policy: {
      required: true,
      minSupportedBinaryVersion: "1.5.0",
      message: "Install the latest desktop app.",
      distributions: {
        mas: {
          storeUrl: "https://apps.apple.com/app/id123456789",
        },
      },
    },
    desktop: {
      renderer: null,
      app: null,
    },
  })

  expect(parsed.releaseKind).toBe("binary")
  expect(parsed.policy.distributions.mas.storeUrl).toContain("apps.apple.com")
})
```

```ts
it("writes distribution-aware policy keys for desktop binary metadata", async () => {
  await syncGitHubReleases(env)

  expect(kvEntries.get(KV_KEYS.policy("desktop", "stable", "mas"))).toBeDefined()
  expect(kvEntries.get(KV_KEYS.policy("desktop", "stable", "mss"))).toBeUndefined()
})
```

- [ ] **Step 2: Run the worker tests and verify they fail**

Run: `pnpm --filter @follow/ota exec vitest run src/__tests__/schema.test.ts src/__tests__/policy.test.ts src/__tests__/sync.test.ts`

Expected: FAIL because the schema only supports mobile shape and policy keys are not distribution-aware.

- [ ] **Step 3: Extend the OTA metadata schema and KV key model**

```ts
const binaryKindSchema = z.enum(["ota", "binary", "store"])

const desktopDistributionSchema = z.enum(["direct", "mas", "mss"])

const desktopPolicyDistributionSchema = z.object({
  downloadUrl: z.string().url().optional(),
  storeUrl: z.string().url().optional(),
})

const desktopReleaseSchema = z.object({
  schemaVersion: z.literal(2),
  product: z.literal("desktop"),
  channel: z.enum(["stable", "beta", "alpha"]),
  releaseVersion: semver,
  releaseKind: binaryKindSchema.transform((value) => (value === "store" ? "binary" : value)),
  runtimeVersion: semver.nullable(),
  publishedAt: z.string().datetime(),
  git: z.object({
    tag: z.string().min(1),
    commit: z.string().min(7),
  }),
  policy: z.object({
    required: z.boolean(),
    minSupportedBinaryVersion: semver,
    message: z.string().nullable(),
    distributions: z.record(desktopDistributionSchema, desktopPolicyDistributionSchema).default({}),
  }),
  desktop: z.object({
    renderer: z
      .object({
        version: semver,
        commit: z.string().min(7),
        launchAsset: assetSchema,
        assets: z.array(assetSchema),
      })
      .nullable(),
    app: z
      .object({
        platforms: z.record(
          z.enum(["macos", "windows", "linux"]),
          z.object({
            platform: z.string().min(1),
            releaseDate: z.string().datetime().nullable(),
            manifest: z.object({
              name: z.string().min(1),
              downloadUrl: z.string().url(),
            }),
            files: z.array(
              z.object({
                filename: z.string().min(1),
                sha512: z.string().min(1),
                size: z.number().int().nonnegative(),
                downloadUrl: z.string().url(),
              }),
            ),
          }),
        ),
      })
      .nullable(),
  }),
})

export const otaReleaseSchema = z.union([mobileReleaseSchema, desktopReleaseSchema])
```

```ts
policy: (
  product: OtaRelease["product"],
  channel: string,
  distribution?: "direct" | "mas" | "mss",
) => distribution ? `policy:${product}:${channel}:${distribution}` : `policy:${product}:${channel}`,
```

- [ ] **Step 4: Persist desktop binary policy records and only mirror renderer OTA archives**

```ts
if (release.product === "desktop" && release.releaseKind === "binary") {
  await putReleaseRecord(env.OTA_KV, release.product, release.releaseVersion, release)

  for (const [distribution, value] of Object.entries(release.policy.distributions)) {
    await env.OTA_KV.put(
      KV_KEYS.policy(release.product, release.channel, distribution),
      JSON.stringify({
        releaseVersion: release.releaseVersion,
        required: release.policy.required,
        minSupportedBinaryVersion: release.policy.minSupportedBinaryVersion,
        message: release.policy.message,
        publishedAt: release.publishedAt,
        distribution,
        ...value,
      }),
    )
  }

  continue
}
```

```ts
function hasCompleteMirroredPayload(
  release: OtaRelease,
  platform: OtaPlatform,
  mirroredFileKeys: ReadonlySet<string>,
) {
  if (release.product === "desktop") {
    const renderer = release.desktop?.renderer
    if (!renderer || platform === "ios" || platform === "android") {
      return false
    }

    return mirroredFileKeys.has(buildMirroredAssetKey(release, platform, renderer.launchAsset.path))
  }

  // existing mobile branch
}
```

- [ ] **Step 5: Run the worker tests again and verify they pass**

Run: `pnpm --filter @follow/ota exec vitest run src/__tests__/schema.test.ts src/__tests__/policy.test.ts src/__tests__/sync.test.ts`

Expected: PASS with desktop schema, alias, and distribution-aware policy coverage.

- [ ] **Step 6: Commit the schema and sync changes**

Run:

```bash
git add \
  apps/ota/src/lib/schema.ts \
  apps/ota/src/lib/constants.ts \
  apps/ota/src/lib/kv.ts \
  apps/ota/src/lib/policy.ts \
  apps/ota/src/lib/sync.ts \
  apps/ota/src/__tests__/schema.test.ts \
  apps/ota/src/__tests__/policy.test.ts \
  apps/ota/src/__tests__/sync.test.ts
git commit -m "feat(ota): add desktop metadata sync and policy storage"
```

## Task 4: Add Desktop `manifest` and `policy` Routes to `apps/ota`

**Files:**

- Create: `apps/ota/src/lib/request.ts`
- Create: `apps/ota/src/lib/desktop.ts`
- Modify: `apps/ota/src/lib/manifest.ts`
- Modify: `apps/ota/src/routes/manifest.ts`
- Modify: `apps/ota/src/routes/policy.ts`
- Modify: `apps/ota/src/__tests__/manifest.test.ts`
- Modify: `apps/ota/src/__tests__/policy.test.ts`

- [ ] **Step 1: Write failing route tests for desktop `direct`, `mas`, and `mss`**

```ts
it("returns renderer and app payloads for desktop direct builds", async () => {
  const response = await fetchWorker(
    "/manifest",
    {
      headers: {
        "x-app-platform": "desktop/windows/exe",
        "x-app-version": "1.5.0",
        "x-app-runtime-version": "1.5.0",
        "x-app-renderer-version": "1.5.0",
        "x-app-channel": "stable",
      },
    },
    {
      kvEntries: new Map([
        [KV_KEYS.latest("desktop", "stable", "1.5.0", "windows"), { releaseVersion: "1.5.1" }],
        [KV_KEYS.release("desktop", "1.5.1"), createDesktopOtaRelease()],
      ]),
    },
  )

  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toMatchObject({
    product: "desktop",
    renderer: {
      version: "1.5.1",
    },
    app: {
      version: "1.5.1",
      platform: "windows-x64",
    },
  })
})
```

```ts
it("returns only renderer for desktop store distributions", async () => {
  const response = await fetchWorker(
    "/manifest",
    {
      headers: {
        "x-app-platform": "desktop/macos/mas",
        "x-app-version": "1.5.0",
        "x-app-runtime-version": "1.5.0",
        "x-app-renderer-version": "1.5.0",
        "x-app-channel": "stable",
      },
    },
    {
      kvEntries: new Map([
        [KV_KEYS.latest("desktop", "stable", "1.5.0", "macos"), { releaseVersion: "1.5.1" }],
        [KV_KEYS.release("desktop", "1.5.1"), createDesktopOtaRelease()],
      ]),
    },
  )

  await expect(response.json()).resolves.toMatchObject({
    renderer: {
      version: "1.5.1",
    },
    app: null,
  })
})
```

```ts
it("returns distribution-specific desktop policy and falls back to generic policy", () => {
  const policy = evaluateBinaryPolicy(
    {
      installedBinaryVersion: "1.5.0",
      distribution: "mas",
    },
    {
      targeted: {
        targetVersion: "1.5.1",
        required: true,
        storeUrl: "https://apps.apple.com/app/id123456789",
      },
      generic: null,
    },
  )

  expect(policy).toEqual({
    action: "block",
    targetVersion: "1.5.1",
    distribution: "mas",
    storeUrl: "https://apps.apple.com/app/id123456789",
    downloadUrl: null,
    message: null,
    publishedAt: null,
  })
})
```

- [ ] **Step 2: Run the route tests and verify they fail**

Run: `pnpm --filter @follow/ota exec vitest run src/__tests__/manifest.test.ts src/__tests__/policy.test.ts`

Expected: FAIL because the routes only parse Expo headers and return mobile-only responses.

- [ ] **Step 3: Parse `X-App-*` headers into desktop request context**

```ts
export function parseDesktopRequest(c: Context<{ Bindings: Env }>) {
  const platformHeader = c.req.header("x-app-platform")
  const version = c.req.header("x-app-version")
  const runtimeVersion = c.req.header("x-app-runtime-version") ?? version
  const rendererVersion = c.req.header("x-app-renderer-version")
  const channel = c.req.header("x-app-channel")

  const mapping = {
    "desktop/macos/dmg": { platform: "macos", distribution: "direct" },
    "desktop/macos/mas": { platform: "macos", distribution: "mas" },
    "desktop/windows/exe": { platform: "windows", distribution: "direct" },
    "desktop/windows/ms": { platform: "windows", distribution: "mss" },
    "desktop/linux": { platform: "linux", distribution: "direct" },
  }[platformHeader ?? ""]

  return {
    product: "desktop",
    platform: mapping?.platform ?? null,
    distribution: mapping?.distribution ?? null,
    installedBinaryVersion: version ?? null,
    runtimeVersion: runtimeVersion ?? null,
    rendererVersion: rendererVersion ?? null,
    channel: channel ?? null,
  }
}
```

- [ ] **Step 4: Build desktop `manifest` and `policy` responses**

```ts
export function buildDesktopManifest(
  release: DesktopOtaRelease,
  input: {
    platform: "macos" | "windows" | "linux"
    distribution: "direct" | "mas" | "mss"
    installedBinaryVersion: string | null
    rendererVersion: string | null
    origin: string
  },
) {
  const renderer =
    compareSemver(release.desktop.renderer.version, input.rendererVersion ?? "0.0.0") > 0
      ? {
          releaseVersion: release.releaseVersion,
          version: release.desktop.renderer.version,
          commit: release.desktop.renderer.commit,
          launchAsset: toManifestAsset(
            release,
            input.origin,
            input.platform,
            release.desktop.renderer.launchAsset,
          ),
          assets: release.desktop.renderer.assets.map((asset) =>
            toManifestAsset(release, input.origin, input.platform, asset),
          ),
        }
      : null

  const app =
    input.distribution === "direct" && release.desktop.app?.platforms[input.platform]
      ? release.desktop.app.platforms[input.platform]
      : null

  return renderer || app
    ? {
        id: release.updateId ?? crypto.randomUUID(),
        createdAt: release.publishedAt,
        product: "desktop",
        channel: release.channel,
        runtimeVersion: release.runtimeVersion,
        renderer,
        app,
      }
    : null
}
```

```ts
const desktopPolicy = evaluateBinaryPolicy(
  {
    installedBinaryVersion,
    distribution,
  },
  {
    targeted: distribution
      ? await getPolicyRecord(c.env.OTA_KV, product, channel, distribution)
      : null,
    generic: await getPolicyRecord(c.env.OTA_KV, product, channel),
  },
)
```

- [ ] **Step 5: Re-run the route tests and verify they pass**

Run: `pnpm --filter @follow/ota exec vitest run src/__tests__/manifest.test.ts src/__tests__/policy.test.ts`

Expected: PASS for desktop `direct`, `mas`, `mss`, and existing mobile coverage.

- [ ] **Step 6: Commit the route and request-parsing work**

Run:

```bash
git add \
  apps/ota/src/lib/request.ts \
  apps/ota/src/lib/desktop.ts \
  apps/ota/src/lib/manifest.ts \
  apps/ota/src/routes/manifest.ts \
  apps/ota/src/routes/policy.ts \
  apps/ota/src/__tests__/manifest.test.ts \
  apps/ota/src/__tests__/policy.test.ts
git commit -m "feat(ota): add desktop manifest and policy routes"
```

## Task 5: Move the New Desktop Updater to `apps/ota`

**Files:**

- Create: `apps/desktop/layer/main/src/updater/types.ts`
- Create: `apps/desktop/layer/main/src/updater/api.test.ts`
- Create: `apps/desktop/layer/main/src/updater/index.test.ts`
- Modify: `packages/internal/shared/src/env.common.ts`
- Modify: `packages/internal/shared/src/env.desktop.ts`
- Modify: `apps/desktop/layer/main/src/updater/api.ts`
- Modify: `apps/desktop/layer/main/src/updater/follow-update-provider.ts`
- Modify: `apps/desktop/layer/main/src/updater/hot-updater.ts`
- Modify: `apps/desktop/layer/main/src/updater/index.ts`

- [ ] **Step 1: Write failing tests for the desktop OTA API client and decision flow**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("fetchDesktopManifest", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "test",
            createdAt: "2026-04-11T10:00:00.000Z",
            product: "desktop",
            channel: "stable",
            runtimeVersion: "1.5.0",
            renderer: null,
            app: {
              releaseVersion: "1.5.1",
              version: "1.5.1",
              platform: "windows-x64",
              releaseDate: "2026-04-11T10:00:00.000Z",
              manifest: {
                name: "latest.yml",
                downloadUrl: "https://ota.folo.is/latest.yml",
              },
              files: [
                {
                  filename: "Folo-1.5.1-windows-x64.exe",
                  sha512: "base64sha512",
                  size: 123,
                  downloadUrl: "https://ota.folo.is/Folo-1.5.1-windows-x64.exe",
                },
              ],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    )
  })

  it("sends only X-App headers to the OTA endpoint", async () => {
    const { fetchDesktopManifest } = await import("./api")
    await fetchDesktopManifest()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/manifest"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-App-Platform": expect.any(String),
          "X-App-Version": expect.any(String),
          "X-App-Channel": expect.any(String),
        }),
      }),
    )
  })
})
```

```ts
it("prefers renderer OTA over direct full-app updates", async () => {
  const result = await updater.handleManifestDecision({
    renderer: {
      version: "1.5.1",
      releaseVersion: "1.5.1",
      commit: "abcdef123456",
      launchAsset: {
        url: "https://ota.folo.is/assets/renderer.tar.gz",
        hash: "rendererhash",
        key: "render-asset",
        contentType: "application/gzip",
      },
      assets: [],
    },
    app: {
      version: "1.5.1",
      releaseVersion: "1.5.1",
      platform: "windows-x64",
      releaseDate: "2026-04-11T10:00:00.000Z",
      manifest: {
        name: "latest.yml",
        downloadUrl: "https://ota.folo.is/latest.yml",
      },
      files: [
        {
          filename: "Folo-1.5.1-windows-x64.exe",
          sha512: "base64sha512",
          size: 123,
          downloadUrl: "https://ota.folo.is/Folo-1.5.1-windows-x64.exe",
        },
      ],
    },
  })

  expect(result).toEqual({ hasUpdate: true, kind: "renderer" })
})
```

- [ ] **Step 2: Run the desktop updater tests and verify they fail**

Run: `pnpm --dir apps/desktop/layer/main exec vitest run src/updater/api.test.ts src/updater/index.test.ts`

Expected: FAIL because the updater still fetches `follow-server` SDK routes and expects old `LatestReleasePayload`.

- [ ] **Step 3: Add a dedicated OTA base URL and local updater response types**

```ts
VITE_OTA_URL: z.string().url().default("https://ota.folo.is"),
```

```ts
export interface DesktopManifestResponse {
  id: string
  createdAt: string
  product: "desktop"
  channel: "stable" | "beta" | "alpha"
  runtimeVersion: string
  renderer: DesktopRendererPayload | null
  app: DesktopAppPayload | null
}

export interface DesktopPolicyResponse {
  action: "none" | "prompt" | "block"
  targetVersion: string | null
  message: string | null
  distribution: "direct" | "mas" | "mss" | null
  downloadUrl: string | null
  storeUrl: string | null
  publishedAt: string | null
}
```

- [ ] **Step 4: Replace `follow-server` updater calls with `apps/ota` fetchers**

```ts
export const fetchDesktopManifest = async (): Promise<DesktopManifestResponse | null> => {
  const response = await fetch(new URL("/manifest", env.VITE_OTA_URL), {
    headers: {
      ...createDesktopAPIHeaders({ version: appVersion }),
      "X-App-Channel": channel,
      "X-App-Runtime-Version": appRuntimeVersion,
      "X-App-Renderer-Version": rendererVersion,
    },
    cache: "no-store",
  })

  if (response.status === 204) {
    return null
  }

  return desktopManifestSchema.parse(await response.json())
}

export const fetchDesktopPolicy = async (): Promise<DesktopPolicyResponse> => {
  const response = await fetch(new URL("/policy", env.VITE_OTA_URL), {
    headers: {
      ...createDesktopAPIHeaders({ version: appVersion }),
      "X-App-Channel": channel,
    },
    cache: "no-store",
  })

  return desktopPolicySchema.parse(await response.json())
}
```

```ts
evaluateManifest(manifest: RendererManifest | null): RendererEligibilityResult {
  if (!manifest) {
    return { status: RendererEligibilityStatus.NoManifest }
  }

  if (manifest.version === appVersion) {
    return {
      status: RendererEligibilityStatus.AlreadyCurrent,
      reason: "Renderer version matches current app version",
    }
  }

  // keep commit and installed-manifest checks, but remove mainHash checks
}
```

```ts
const manifest = await fetchDesktopManifest()
const policy = await fetchDesktopPolicy()

if (manifest?.renderer) {
  return this.handleRendererPayload(manifest.renderer, manifest.app)
}

if (manifest?.app) {
  return this.handleDirectAppPayload(manifest.app)
}

if (policy.action !== "none") {
  return this.notifyBinaryPolicy(policy)
}
```

- [ ] **Step 5: Re-run updater tests and typecheck**

Run: `pnpm --dir apps/desktop/layer/main exec vitest run src/updater/api.test.ts src/updater/index.test.ts`

Expected: PASS for renderer-first behavior, direct-installer fallback, and policy handling.

Run: `pnpm --dir apps/desktop/layer/main typecheck`

Expected: PASS with no `@follow-app/client-sdk` update-response dependency left in updater files.

- [ ] **Step 6: Commit the desktop updater migration**

Run:

```bash
git add \
  packages/internal/shared/src/env.common.ts \
  packages/internal/shared/src/env.desktop.ts \
  apps/desktop/layer/main/src/updater/types.ts \
  apps/desktop/layer/main/src/updater/api.ts \
  apps/desktop/layer/main/src/updater/api.test.ts \
  apps/desktop/layer/main/src/updater/index.ts \
  apps/desktop/layer/main/src/updater/index.test.ts \
  apps/desktop/layer/main/src/updater/follow-update-provider.ts \
  apps/desktop/layer/main/src/updater/hot-updater.ts
git commit -m "feat(desktop): switch updater to ota service"
```

## Task 6: Update Runbooks and Run Full Verification

**Files:**

- Modify: `apps/ota/README.md`

- [ ] **Step 1: Document desktop headers, release modes, and distribution-aware policy behavior**

```md
Desktop requests use the existing `X-App-*` headers:

- `X-App-Platform`
- `X-App-Version`
- `X-App-Channel`
- optional `X-App-Runtime-Version`
- optional `X-App-Renderer-Version`

Desktop release modes:

- `build`: direct installers only
- `ota`: renderer OTA plus direct installers
- `binary-policy`: distribution-specific policy metadata only
```

- [ ] **Step 2: Run focused verification before the full repo checks**

Run:

```bash
pnpm exec vitest run \
  apps/desktop/scripts/apply-release-config.test.ts \
  .github/scripts/resolve-desktop-release-config.test.ts \
  .github/scripts/build-ota-release.test.ts
pnpm --filter @follow/ota test
pnpm --dir apps/desktop/layer/main exec vitest run src/updater/api.test.ts src/updater/index.test.ts
pnpm --filter @follow/ota typecheck
pnpm --dir apps/desktop/layer/main typecheck
```

Expected: PASS for release config, metadata generation, worker routing, and updater behavior.

- [ ] **Step 3: Run repository quality gates in the required order**

Run:

```bash
pnpm run typecheck
pnpm run lint:fix
pnpm run test
npm exec turbo run format:check typecheck lint
npm exec turbo run test
```

Expected: PASS across the monorepo with no new lint, type, or test failures.

- [ ] **Step 4: Commit docs and verification updates**

Run:

```bash
git add apps/ota/README.md
git commit -m "docs(ota): document desktop update flow"
```

## Self-Review

### Spec Coverage

- Release config workflow in the spec is covered by Task 1.
- Unified metadata publication and file-driven release execution are covered by Task 2.
- Desktop schema, `binary` release kind, and distribution-aware policy persistence are covered by Task 3.
- Desktop `manifest` and `policy` routes with `X-App-*` headers are covered by Task 4.
- New desktop client migration onto `apps/ota` is covered by Task 5.
- README and required verification commands are covered by Task 6.

### Placeholder Scan

- No `TODO`, `TBD`, or “similar to previous task” placeholders remain.
- Every task lists concrete files, commands, and example code to implement.

### Type Consistency

- `runtimeVersion` is the desktop OTA compatibility key everywhere in Tasks 2 through 5.
- `installedBinaryVersion` stays tied to `X-App-Version` and `/policy`.
- `direct`, `mas`, and `mss` are the only desktop distribution values used throughout the plan.
- Legacy `store` metadata is only referenced as an alias handled in Worker schema parsing, not as a new canonical type.
