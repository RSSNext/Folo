#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import yaml from "js-yaml"
import { dirname, extname, join, resolve } from "pathe"

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..")
const DEFAULT_MOBILE_PROJECT_DIR = join(REPO_ROOT, "apps", "mobile")
const DEFAULT_DESKTOP_PROJECT_DIR = join(REPO_ROOT, "apps", "desktop")
const OTA_PLATFORMS = ["ios", "android"]
const DESKTOP_PLATFORMS = new Set(["macos", "windows", "linux"])
const CONTENT_TYPES = new Map([
  [".aac", "audio/aac"],
  [".bmp", "image/bmp"],
  [".bundle", "application/javascript"],
  [".css", "text/css"],
  [".gif", "image/gif"],
  [".gz", "application/gzip"],
  [".hbc", "application/javascript"],
  [".html", "text/html"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "application/javascript"],
  [".json", "application/json"],
  [".m4a", "audio/mp4"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".otf", "font/otf"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml"],
])
const DESKTOP_MANIFEST_FILE_NAMES = new Set(["latest.yml", "latest-mac.yml", "latest-linux.yml"])

/**
 * @typedef {{
 *   path: string
 *   ext?: string
 * }} ExportAssetMetadata
 */

/**
 * @typedef {{
 *   path: string
 *   sha256: string
 *   contentType: string
 * }} OtaAsset
 */

/**
 * @typedef {{
 *   bundle: string
 *   assets?: unknown[]
 * }} ExportPlatformMetadata
 */

/**
 * @typedef {{
 *   fileMetadata?: Partial<Record<"ios" | "android", ExportPlatformMetadata>>
 * }} ExportMetadata
 */

/**
 * @typedef {{
 *   product: string
 *   channel: string
 *   releaseVersion: string
 *   releaseKind: string
 *   runtimeVersion: string
 *   gitTag: string
 *   gitCommit: string
 *   publishedAt: string
 *   policy: {
 *     storeRequired: boolean
 *     minSupportedBinaryVersion: string
 *     message: string | null
 *   }
 *   metadata: ExportMetadata
 *   resolveAsset: (asset: ExportAssetMetadata) => Promise<OtaAsset>
 * }} BuildOtaMetadataInput
 */

/**
 * @param {BuildOtaMetadataInput} input
 */
export async function buildOtaMetadata(input) {
  /** @type {Record<string, { launchAsset: OtaAsset, assets: OtaAsset[] }>} */
  const platforms = {}

  if (input.releaseKind === "ota") {
    const fileMetadata = resolveExportFileMetadata(input.metadata)

    for (const platform of OTA_PLATFORMS) {
      const platformMetadata = resolvePlatformMetadata(fileMetadata, platform)
      const launchAsset = { path: normalizeAssetPath(platformMetadata.bundle) }
      const assets = collectAssets(platformMetadata.assets, platform)

      platforms[platform] = {
        launchAsset: await input.resolveAsset(launchAsset),
        assets: await Promise.all(assets.map((asset) => input.resolveAsset(asset))),
      }
    }
  }

  return {
    schemaVersion: 1,
    updateId: createDeterministicUuid(
      `${input.product}:${input.channel}:${input.releaseVersion}:${input.runtimeVersion}:${input.gitTag}:${input.gitCommit}`,
    ),
    product: input.product,
    channel: input.channel,
    releaseVersion: input.releaseVersion,
    releaseKind: input.releaseKind,
    runtimeVersion: input.runtimeVersion,
    publishedAt: input.publishedAt,
    git: {
      tag: input.gitTag,
      commit: input.gitCommit,
    },
    policy: input.policy,
    platforms,
  }
}

function createDeterministicUuid(seed) {
  const digest = createHash("sha1").update(seed).digest()
  const bytes = Buffer.from(digest.subarray(0, 16))

  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString("hex")
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
}

export async function buildReleaseAssets(options = {}) {
  const projectDir = resolveMobileProjectDir(options.projectDir)
  const distDir = join(projectDir, "dist")
  const metadataPath = join(distDir, "metadata.json")
  const archivePath = join(projectDir, "dist.tar.zst")

  const packageJson = await readJson(join(projectDir, "package.json"))
  const product = process.env.OTA_PRODUCT ?? "mobile"
  const channel = process.env.OTA_CHANNEL ?? "production"
  const releaseVersion = process.env.OTA_RELEASE_VERSION ?? packageJson.version
  const releaseKind = process.env.OTA_RELEASE_KIND ?? "ota"
  const runtimeVersion = process.env.OTA_RUNTIME_VERSION ?? packageJson.version
  const gitTag = process.env.OTA_GIT_TAG ?? `${product}/v${releaseVersion}`
  const gitCommit = process.env.OTA_GIT_COMMIT ?? execGit(["rev-parse", "HEAD"], REPO_ROOT)
  const publishedAt = process.env.OTA_PUBLISHED_AT ?? new Date().toISOString()

  if (releaseKind === "ota" && !existsSync(metadataPath)) {
    throw new Error(
      `Missing Expo export metadata at ${metadataPath}. Run "pnpm --dir apps/mobile run update:export" first.`,
    )
  }

  const metadata = releaseKind === "ota" ? await readJson(metadataPath) : { fileMetadata: {} }

  const otaMetadata = await buildOtaMetadata({
    product,
    channel,
    releaseVersion,
    releaseKind,
    runtimeVersion,
    gitTag,
    gitCommit,
    publishedAt,
    policy: {
      storeRequired: parseBooleanEnv("OTA_STORE_REQUIRED", false),
      minSupportedBinaryVersion: process.env.OTA_MIN_SUPPORTED_BINARY_VERSION ?? runtimeVersion,
      message: parseNullableEnv("OTA_POLICY_MESSAGE"),
    },
    metadata,
    resolveAsset: async (asset) => {
      const assetFilePath = join(distDir, asset.path)
      let assetBuffer

      try {
        assetBuffer = await readFile(assetFilePath)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        throw new Error(
          `Failed to read exported asset "${asset.path}" at ${assetFilePath}: ${reason}`,
        )
      }

      return {
        path: asset.path,
        sha256: createHash("sha256").update(assetBuffer).digest("hex"),
        contentType: resolveContentType(asset),
      }
    },
  })

  const outputPath = join(distDir, "ota-release.json")

  await mkdir(distDir, { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(otaMetadata, null, 2)}\n`, "utf8")

  if (releaseKind === "ota") {
    await createTarZstArchive({ distDir, archivePath })
  }

  return {
    projectDir,
    distDir,
    metadataPath,
    outputPath,
    archivePath: releaseKind === "ota" ? archivePath : null,
    otaMetadata,
  }
}

export async function buildDesktopReleaseAssets(options = {}) {
  const projectDir = resolveDesktopProjectDir(options.projectDir)
  const distDir = join(projectDir, "dist")
  const outputPath = join(distDir, "ota-release.json")
  const archivePath = join(projectDir, "dist.tar.zst")
  const releaseConfig = await readJson(join(projectDir, "release.json"))
  const packageJson = await readJson(join(projectDir, "package.json"))
  const releaseVersion = releaseConfig.version ?? packageJson.version
  const product = process.env.OTA_PRODUCT ?? "desktop"
  const gitTag = process.env.OTA_GIT_TAG ?? `${product}/v${releaseVersion}`
  const gitCommit = process.env.OTA_GIT_COMMIT ?? execGit(["rev-parse", "HEAD"], REPO_ROOT)
  const publishedAt = process.env.OTA_PUBLISHED_AT ?? new Date().toISOString()
  const [owner, repo] = resolveRepository(options)
  const releaseKind = releaseConfig.mode === "ota" ? "ota" : "binary"
  const runtimeVersion = releaseConfig.mode === "ota" ? releaseConfig.runtimeVersion : null
  const desktopApp =
    releaseConfig.mode === "binary-policy"
      ? null
      : await collectDesktopAppPayload({
          projectDir,
          owner,
          repo,
          gitTag,
        })

  if (releaseConfig.mode !== "binary-policy" && !desktopApp) {
    throw new Error(
      `Desktop ${releaseConfig.mode} mode requires direct installer manifests in ${join(projectDir, "out", "make")}`,
    )
  }
  const desktopRenderer =
    releaseConfig.mode === "ota"
      ? await collectDesktopRendererPayload({
          projectDir,
          owner,
          repo,
          gitTag,
        })
      : null

  await mkdir(distDir, { recursive: true })

  const otaMetadata = {
    schemaVersion: 2,
    product,
    channel: releaseConfig.channel ?? null,
    releaseVersion,
    releaseKind,
    runtimeVersion,
    publishedAt,
    git: {
      tag: gitTag,
      commit: gitCommit,
    },
    policy: {
      required: releaseConfig.required ?? false,
      minSupportedBinaryVersion: process.env.OTA_MIN_SUPPORTED_BINARY_VERSION ?? releaseVersion,
      message: releaseConfig.message ?? null,
      distributions: Object.fromEntries(
        (releaseConfig.distributions ?? []).map((distribution) => [distribution, {}]),
      ),
    },
    desktop: {
      renderer: desktopRenderer,
      app: desktopApp,
    },
  }

  await writeFile(outputPath, `${JSON.stringify(otaMetadata, null, 2)}\n`, "utf8")

  if (releaseConfig.mode === "ota") {
    await createTarZstArchive({ distDir, archivePath })
  }

  return {
    projectDir,
    distDir,
    outputPath,
    archivePath: releaseConfig.mode === "ota" ? archivePath : null,
    otaMetadata,
  }
}

async function main() {
  try {
    const result =
      (process.env.OTA_PRODUCT ?? "mobile") === "desktop"
        ? await buildDesktopReleaseAssets()
        : await buildReleaseAssets()

    console.info(`Wrote OTA metadata: ${result.outputPath}`)
    if (result.archivePath) {
      console.info(`Wrote OTA archive: ${result.archivePath}`)
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}

/**
 * @param {unknown} value
 */
function resolveExportFileMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    throw new Error("Expo export metadata is missing fileMetadata")
  }

  if (!metadata.fileMetadata || typeof metadata.fileMetadata !== "object") {
    throw new Error("Expo export metadata is missing fileMetadata")
  }

  return metadata.fileMetadata
}

function resolvePlatformMetadata(fileMetadata, platform) {
  const platformMetadata = fileMetadata[platform]

  if (!platformMetadata || typeof platformMetadata !== "object") {
    throw new Error(`Expo export metadata is missing ${platform} platform metadata`)
  }

  if (typeof platformMetadata.bundle !== "string" || platformMetadata.bundle.length === 0) {
    throw new Error(`Expo export metadata is missing ${platform} bundle metadata`)
  }

  return platformMetadata
}

function collectAssets(value, platform) {
  if (value == null) {
    throw new TypeError(`Expo export metadata is missing ${platform} assets metadata`)
  }

  if (!Array.isArray(value)) {
    throw new TypeError(`Expo export metadata has invalid ${platform} assets metadata`)
  }

  /** @type {Map<string, ExportAssetMetadata>} */
  const dedupedAssets = new Map()

  for (const asset of value) {
    const normalizedAsset = normalizeExportAsset(asset)
    const existingAsset = dedupedAssets.get(normalizedAsset.path)

    if (!existingAsset || (!existingAsset.ext && normalizedAsset.ext)) {
      dedupedAssets.set(normalizedAsset.path, normalizedAsset)
      continue
    }

    if (existingAsset.ext && normalizedAsset.ext && existingAsset.ext !== normalizedAsset.ext) {
      throw new Error(
        `Expo export metadata has conflicting ext values for asset "${normalizedAsset.path}"`,
      )
    }
  }

  return [...dedupedAssets.values()]
}

/**
 * @param {unknown} asset
 */
function normalizeExportAsset(asset) {
  if (typeof asset === "string") {
    return { path: normalizeAssetPath(asset) }
  }

  if (!asset || typeof asset !== "object") {
    throw new Error(`Unsupported Expo asset metadata entry: ${JSON.stringify(asset)}`)
  }

  const assetPath =
    "path" in asset && typeof asset.path === "string"
      ? asset.path
      : "file" in asset && typeof asset.file === "string"
        ? asset.file
        : null

  if (!assetPath) {
    throw new Error(`Unsupported Expo asset metadata entry: ${JSON.stringify(asset)}`)
  }

  return {
    path: normalizeAssetPath(assetPath),
    ...("ext" in asset && asset.ext != null ? { ext: normalizeAssetExtension(asset.ext) } : {}),
  }
}

function normalizeAssetExtension(ext) {
  if (typeof ext !== "string") {
    throw new TypeError(`Unsupported Expo asset ext metadata: ${JSON.stringify(ext)}`)
  }

  const normalizedExt = ext.trim().replace(/^\.+/, "").toLowerCase()

  if (!normalizedExt) {
    throw new Error(`Invalid exported asset ext "${ext}"`)
  }

  return normalizedExt
}

function resolveMobileProjectDir(projectDir) {
  if (projectDir) {
    return resolve(projectDir)
  }

  const cwd = resolve(process.cwd())

  if (existsSync(join(cwd, "package.json")) && existsSync(join(cwd, "scripts", "expo-update.ts"))) {
    return cwd
  }

  if (existsSync(join(cwd, "apps", "mobile", "package.json"))) {
    return join(cwd, "apps", "mobile")
  }

  return DEFAULT_MOBILE_PROJECT_DIR
}

function resolveDesktopProjectDir(projectDir) {
  if (projectDir) {
    return resolve(projectDir)
  }

  const cwd = resolve(process.cwd())

  if (existsSync(join(cwd, "package.json")) && existsSync(join(cwd, "release.json"))) {
    return cwd
  }

  if (existsSync(join(cwd, "apps", "desktop", "package.json"))) {
    return join(cwd, "apps", "desktop")
  }

  return DEFAULT_DESKTOP_PROJECT_DIR
}

function normalizeAssetPath(assetPath) {
  const normalized = assetPath
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/^(\.\/)+/, "")
    .replaceAll(/\/{2,}/g, "/")

  if (!normalized || normalized.split("/").includes("..")) {
    throw new Error(`Invalid exported asset path "${assetPath}"`)
  }

  return normalized
}

function resolveContentType(asset) {
  const normalizedPath = String(asset.path).toLowerCase()
  const pathExtension = normalizedPath.endsWith(".tar.gz")
    ? ".gz"
    : extname(normalizedPath).toLowerCase()
  const metadataExtension = asset.ext ? `.${asset.ext}` : ""
  const extension = pathExtension || metadataExtension

  return CONTENT_TYPES.get(extension) ?? "application/octet-stream"
}

async function createTarZstArchive({ distDir, archivePath }) {
  const zstdBinary = resolveZstdBinary()

  await new Promise((resolvePromise, rejectPromise) => {
    let tarExited = false
    let zstdExited = false

    const tarProcess = spawn("tar", ["-cf", "-", "-C", distDir, "."], {
      stdio: ["ignore", "pipe", "inherit"],
    })
    const zstdProcess = spawn(zstdBinary, ["-q", "-f", "-o", archivePath], {
      stdio: ["pipe", "inherit", "inherit"],
    })

    const rejectOnce = once((error) => rejectPromise(error))
    const resolveIfComplete = () => {
      if (tarExited && zstdExited) {
        resolvePromise(void 0)
      }
    }

    tarProcess.on("error", (error) => {
      rejectOnce(new Error(`Failed to run tar: ${error.message}`))
    })
    zstdProcess.on("error", (error) => {
      rejectOnce(new Error(`Failed to run zstd: ${error.message}`))
    })

    tarProcess.stdout.on("error", (error) => {
      rejectOnce(new Error(`Failed to stream tar output: ${error.message}`))
    })
    zstdProcess.stdin.on("error", (error) => {
      rejectOnce(new Error(`Failed to stream zstd input: ${error.message}`))
    })

    tarProcess.stdout.pipe(zstdProcess.stdin)

    tarProcess.on("close", (code) => {
      if (code !== 0) {
        rejectOnce(new Error(`tar exited with code ${code}`))
        return
      }

      tarExited = true
      resolveIfComplete()
    })

    zstdProcess.on("close", (code) => {
      if (code !== 0) {
        rejectOnce(new Error(`zstd exited with code ${code}`))
        return
      }

      zstdExited = true
      resolveIfComplete()
    })
  })
}

function resolveZstdBinary() {
  const candidates = [process.env.ZSTD_BIN, "zstd", "/opt/homebrew/bin/zstd"].filter(Boolean)

  for (const candidate of candidates) {
    const args = candidate === "/opt/homebrew/bin/zstd" ? ["--version"] : ["--version"]
    const result = spawnSync(candidate, args, { stdio: "ignore" })

    if (result.status === 0) {
      return candidate
    }
  }

  throw new Error('Unable to find "zstd". Set ZSTD_BIN or install zstd in PATH.')
}

function execGit(args, cwd) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  })

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `git ${args.join(" ")} failed`)
  }

  return result.stdout.trim()
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"))
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read JSON at ${path}: ${reason}`)
  }
}

async function collectDesktopRendererPayload(input) {
  const rendererManifestPath = join(input.projectDir, "dist", "manifest.yml")

  if (!existsSync(rendererManifestPath)) {
    throw new Error(`Missing desktop renderer manifest at ${rendererManifestPath}`)
  }

  const rendererManifest = parseYamlFile(rendererManifestPath)

  if (typeof rendererManifest.version !== "string" || !rendererManifest.version) {
    throw new Error(`Desktop renderer manifest at ${rendererManifestPath} is missing version`)
  }

  if (typeof rendererManifest.commit !== "string" || !rendererManifest.commit) {
    throw new Error(`Desktop renderer manifest at ${rendererManifestPath} is missing commit`)
  }

  const filename =
    typeof rendererManifest.filename === "string" && rendererManifest.filename
      ? rendererManifest.filename
      : "render-asset.tar.gz"
  const rendererArchivePath = join(input.projectDir, "dist", filename)

  if (!existsSync(rendererArchivePath)) {
    throw new Error(`Missing desktop renderer archive at ${rendererArchivePath}`)
  }

  return {
    version: rendererManifest.version,
    commit: rendererManifest.commit,
    manifest: {
      name: "manifest.yml",
      downloadUrl: buildGitHubAssetUrl({
        owner: input.owner,
        repo: input.repo,
        tag: input.gitTag,
        filename: "manifest.yml",
      }),
    },
    launchAsset: await resolveFileAsset({
      sourcePath: rendererArchivePath,
      metadataPath: join("renderer", filename),
    }),
    assets: [],
  }
}

async function collectDesktopAppPayload(input) {
  const makeDir = join(input.projectDir, "out", "make")

  if (!existsSync(makeDir)) {
    return null
  }

  const platformEntries = await collectDesktopPlatformEntries({
    makeDir,
    owner: input.owner,
    repo: input.repo,
    gitTag: input.gitTag,
  })

  if (Object.keys(platformEntries).length === 0) {
    return null
  }

  return {
    platforms: platformEntries,
  }
}

async function collectDesktopPlatformEntries(input) {
  /** @type {Record<string, any>} */
  const result = {}

  for (const manifestPath of walkFiles(input.makeDir)) {
    const fileName = manifestPath.split("/").at(-1)
    if (!fileName || !DESKTOP_MANIFEST_FILE_NAMES.has(fileName)) {
      continue
    }

    const manifest = parseYamlFile(manifestPath)
    const platformKey = inferDesktopPlatformKey(manifestPath, fileName)

    if (!platformKey || !DESKTOP_PLATFORMS.has(platformKey)) {
      continue
    }

    const files = normalizeDesktopManifestFiles(manifest.files, manifestPath)
    if (files.length === 0) {
      continue
    }

    const nextEntry = {
      platform: inferDesktopPlatformIdentifier(platformKey, manifestPath),
      releaseDate: normalizeDesktopReleaseDate(manifest.releaseDate),
      manifest: {
        name: fileName,
        path: fileName,
        downloadUrl: buildGitHubAssetUrl({
          owner: input.owner,
          repo: input.repo,
          tag: input.gitTag,
          filename: fileName,
        }),
      },
      files: files.map((file) => ({
        filename: file.url,
        sha512: file.sha512,
        size: file.size,
        downloadUrl: buildGitHubAssetUrl({
          owner: input.owner,
          repo: input.repo,
          tag: input.gitTag,
          filename: file.url,
        }),
      })),
    }

    result[platformKey] = result[platformKey]
      ? mergeDesktopPlatformEntries(result[platformKey], nextEntry)
      : nextEntry
  }

  return result
}

function inferDesktopPlatformKey(manifestPath, fileName) {
  const normalized = manifestPath.replaceAll("\\", "/").toLowerCase()

  if (
    fileName === "latest-mac.yml" ||
    normalized.includes("/darwin") ||
    normalized.includes("/mac")
  ) {
    return "macos"
  }

  if (fileName === "latest-linux.yml" || normalized.includes("/linux")) {
    return "linux"
  }

  if (
    fileName === "latest.yml" ||
    normalized.includes("/windows") ||
    normalized.includes("/squirrel.windows")
  ) {
    return "windows"
  }

  return null
}

function inferDesktopPlatformIdentifier(platformKey, manifestPath) {
  const normalized = manifestPath.replaceAll("\\", "/").toLowerCase()
  const arch = normalized.includes("/arm64") ? "arm64" : normalized.includes("/x64") ? "x64" : null

  if (!arch) {
    return platformKey
  }

  return `${platformKey}-${arch}`
}

function normalizeDesktopManifestFiles(files, manifestPath) {
  if (!Array.isArray(files)) {
    throw new TypeError(`Desktop manifest at ${manifestPath} is missing files`)
  }

  return files.map((file, index) => {
    const url = typeof file?.url === "string" ? file.url : null
    const sha512 = typeof file?.sha512 === "string" ? file.sha512 : null
    const size =
      typeof file?.size === "number" ? file.size : Number.parseInt(String(file?.size ?? 0), 10)

    if (!url || !sha512 || !Number.isFinite(size) || size < 0) {
      throw new Error(`Desktop manifest at ${manifestPath} has invalid files[${index}] entry`)
    }

    return {
      url,
      sha512,
      size,
    }
  })
}

function normalizeDesktopReleaseDate(value) {
  if (typeof value === "string") {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  return null
}

function mergeDesktopPlatformEntries(currentEntry, nextEntry) {
  const fileByName = new Map(currentEntry.files.map((file) => [file.filename, file]))

  for (const file of nextEntry.files) {
    fileByName.set(file.filename, file)
  }

  const mergedReleaseDate = pickLatestReleaseDate(currentEntry.releaseDate, nextEntry.releaseDate)

  return {
    platform:
      currentEntry.platform === nextEntry.platform
        ? currentEntry.platform
        : (currentEntry.platform.split("-")[0] ?? currentEntry.platform),
    releaseDate: mergedReleaseDate,
    manifest: currentEntry.manifest,
    files: [...fileByName.values()],
  }
}

function pickLatestReleaseDate(currentValue, nextValue) {
  const currentTime = currentValue ? Date.parse(currentValue) : Number.NaN
  const nextTime = nextValue ? Date.parse(nextValue) : Number.NaN

  if (Number.isFinite(currentTime) && Number.isFinite(nextTime)) {
    return currentTime >= nextTime ? currentValue : nextValue
  }

  return nextValue ?? currentValue ?? null
}

function parseYamlFile(path) {
  try {
    const content = readFileSync(path, "utf8")
    return yaml.load(String(content)) ?? {}
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to parse YAML at ${path}: ${reason}`)
  }
}

async function resolveFileAsset(input) {
  const buffer = await readFile(input.sourcePath)
  return {
    path: normalizeAssetPath(input.metadataPath),
    sha256: createHash("sha256").update(buffer).digest("hex"),
    contentType: resolveContentType({ path: input.metadataPath }),
  }
}

function buildGitHubAssetUrl({ owner, repo, tag, filename }) {
  return `https://github.com/${owner}/${repo}/releases/download/${tag}/${filename}`
}

function resolveRepository(options) {
  if (options.owner && options.repo) {
    return [options.owner, options.repo]
  }

  const repository = process.env.GITHUB_REPOSITORY
  if (repository && repository.includes("/")) {
    return repository.split("/", 2)
  }

  return ["RSSNext", "Folo"]
}

function walkFiles(rootDir) {
  /** @type {string[]} */
  const results = []
  /** @type {string[]} */
  const pending = [rootDir]

  while (pending.length > 0) {
    const current = pending.pop()
    if (!current) continue

    for (const entryName of readdirSync(current)) {
      const entry = join(current, entryName)
      if (!existsSync(entry)) continue

      if (statSync(entry).isDirectory()) {
        pending.push(entry)
      } else {
        results.push(entry)
      }
    }
  }

  return results.sort()
}

function parseBooleanEnv(name, defaultValue) {
  const value = process.env[name]

  if (value == null) {
    return defaultValue
  }

  if (value === "1" || value.toLowerCase() === "true") {
    return true
  }

  if (value === "0" || value.toLowerCase() === "false") {
    return false
  }

  throw new Error(`${name} must be "true", "false", "1", or "0"`)
}

function parseNullableEnv(name) {
  const value = process.env[name]

  if (value == null || value.length === 0) {
    return null
  }

  return value
}

function once(callback) {
  let called = false

  return (...args) => {
    if (called) {
      return
    }

    called = true
    callback(...args)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main()
}
