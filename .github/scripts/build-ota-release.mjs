#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { dirname, join, resolve } from "pathe"

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
 *   resolveAsset: (assetPath: string) => Promise<OtaAsset>
 * }} BuildOtaMetadataInput
 */

/**
 * @param {BuildOtaMetadataInput} input
 */
export async function buildOtaMetadata(input) {
  /** @type {Record<string, { launchAsset: OtaAsset, assets: OtaAsset[] }>} */
  const platforms = {}

  for (const platform of OTA_PLATFORMS) {
    const platformMetadata = input.metadata.fileMetadata?.[platform]

    if (!platformMetadata?.bundle) {
      continue
    }

    const launchAssetPath = normalizeAssetPath(platformMetadata.bundle)
    const assetPaths = collectAssetPaths(platformMetadata.assets)

    platforms[platform] = {
      launchAsset: await input.resolveAsset(launchAssetPath),
      assets: await Promise.all(assetPaths.map((assetPath) => input.resolveAsset(assetPath))),
    }
  }

  if (Object.keys(platforms).length === 0) {
    throw new Error("Expo export metadata does not include any platform bundles")
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
    resolveAsset: async (assetPath) => {
      const assetFilePath = join(distDir, assetPath)
      let assetBuffer

      try {
        assetBuffer = await readFile(assetFilePath)
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error)
        throw new Error(
          `Failed to read exported asset "${assetPath}" at ${assetFilePath}: ${reason}`,
        )
      }

      return {
        path: assetPath,
        sha256: createHash("sha256").update(assetBuffer).digest("hex"),
        contentType: resolveContentType(assetPath),
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
function collectAssetPaths(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const dedupedPaths = new Set()

  for (const asset of value) {
    const assetPath = resolveAssetPath(asset)

    dedupedPaths.add(normalizeAssetPath(assetPath))
  }

  return [...dedupedPaths]
}

/**
 * @param {unknown} asset
 */
function resolveAssetPath(asset) {
  if (typeof asset === "string") {
    return asset
  }

  if (!asset || typeof asset !== "object") {
    return null
  }

  if ("path" in asset && typeof asset.path === "string") {
    return asset.path
  }

  if ("file" in asset && typeof asset.file === "string") {
    return asset.file
  }

  throw new Error(`Unsupported Expo asset metadata entry: ${JSON.stringify(asset)}`)
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

function resolveContentType(assetPath) {
  const extension = assetPath.includes(".") ? assetPath.slice(assetPath.lastIndexOf(".")) : ""

  return CONTENT_TYPES.get(extension.toLowerCase()) ?? "application/octet-stream"
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
  return JSON.parse(await readFile(path, "utf8"))
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
