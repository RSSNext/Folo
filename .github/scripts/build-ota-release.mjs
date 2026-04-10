#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { dirname, extname, join, resolve } from "pathe"

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..")
const DEFAULT_MOBILE_PROJECT_DIR = join(REPO_ROOT, "apps", "mobile")
const OTA_PLATFORMS = ["ios", "android"]
const CONTENT_TYPES = new Map([
  [".aac", "audio/aac"],
  [".bmp", "image/bmp"],
  [".bundle", "application/javascript"],
  [".css", "text/css"],
  [".gif", "image/gif"],
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

  return {
    schemaVersion: 1,
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

export async function buildReleaseAssets(options = {}) {
  const projectDir = resolveMobileProjectDir(options.projectDir)
  const distDir = join(projectDir, "dist")
  const metadataPath = join(distDir, "metadata.json")

  if (!existsSync(metadataPath)) {
    throw new Error(
      `Missing Expo export metadata at ${metadataPath}. Run "pnpm --dir apps/mobile run update:export" first.`,
    )
  }

  const packageJson = await readJson(join(projectDir, "package.json"))
  const product = process.env.OTA_PRODUCT ?? "mobile"
  const channel = process.env.OTA_CHANNEL ?? "production"
  const releaseVersion = process.env.OTA_RELEASE_VERSION ?? packageJson.version
  const releaseKind = process.env.OTA_RELEASE_KIND ?? "ota"
  const runtimeVersion = process.env.OTA_RUNTIME_VERSION ?? packageJson.version
  const gitTag = process.env.OTA_GIT_TAG ?? `${product}/v${releaseVersion}`
  const gitCommit = process.env.OTA_GIT_COMMIT ?? execGit(["rev-parse", "HEAD"], REPO_ROOT)
  const publishedAt = process.env.OTA_PUBLISHED_AT ?? new Date().toISOString()
  const metadata = await readJson(metadataPath)

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
  const archivePath = join(projectDir, "dist.tar.zst")

  await writeFile(outputPath, `${JSON.stringify(otaMetadata, null, 2)}\n`, "utf8")
  await createTarZstArchive({ distDir, archivePath })

  return {
    projectDir,
    distDir,
    metadataPath,
    outputPath,
    archivePath,
    otaMetadata,
  }
}

async function main() {
  try {
    const result = await buildReleaseAssets()

    console.info(`Wrote OTA metadata: ${result.outputPath}`)
    console.info(`Wrote OTA archive: ${result.archivePath}`)
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
  const pathExtension = extname(asset.path).toLowerCase()
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
