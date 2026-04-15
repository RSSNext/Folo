import { env } from "@follow/shared/env.desktop"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG, { runtimeVersion as configuredRuntimeVersion, version as appVersion } from "@pkg"

import { getCurrentRendererManifest, isRendererManifestUsable } from "~/updater/hot-updater"

import { channel } from "../env"
import type {
  DesktopManifestResponse,
  DesktopPolicyResponse,
  DesktopRendererPayload,
} from "./types"

export { manifestHashToHex } from "./types"

export const getDesktopRuntimeVersion = () => configuredRuntimeVersion ?? appVersion

export const getDesktopRendererVersion = () => {
  const rendererManifest = getCurrentRendererManifest()

  return isRendererManifestUsable(rendererManifest, {
    appVersion,
    runtimeVersion: getDesktopRuntimeVersion(),
  })
    ? rendererManifest!.version
    : appVersion
}

export const buildDesktopOtaHeaders = (includeRenderer = false): Record<string, string> => {
  const headers: Record<string, string> = {
    ...createDesktopAPIHeaders({ version: PKG.version }),
    "X-App-Channel": channel,
    "X-App-Runtime-Version": getDesktopRuntimeVersion(),
  }

  if (includeRenderer) {
    headers["X-App-Renderer-Version"] = getDesktopRendererVersion()
  }

  return headers
}

export const fetchDesktopManifest = async (): Promise<DesktopManifestResponse | null> => {
  const response = await fetch(new URL("/manifest", env.VITE_OTA_URL), {
    headers: buildDesktopOtaHeaders(true),
    cache: "no-store",
  })

  if (response.status === 204) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch desktop OTA manifest (${response.status})`)
  }

  return parseDesktopManifest(await response.json())
}

export const fetchDesktopPolicy = async (): Promise<DesktopPolicyResponse> => {
  const response = await fetch(new URL("/policy", env.VITE_OTA_URL), {
    headers: buildDesktopOtaHeaders(false),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch desktop OTA policy (${response.status})`)
  }

  return parseDesktopPolicy(await response.json())
}

function parseDesktopManifest(payload: unknown): DesktopManifestResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid desktop OTA manifest response")
  }

  const data = payload as Record<string, unknown>
  const { renderer, app } = data

  if (
    data["product"] !== "desktop" ||
    typeof data["id"] !== "string" ||
    typeof data["createdAt"] !== "string" ||
    typeof data["channel"] !== "string" ||
    typeof data["runtimeVersion"] !== "string"
  ) {
    throw new Error("Invalid desktop OTA manifest response")
  }

  return {
    id: data["id"],
    createdAt: data["createdAt"],
    product: "desktop",
    channel: data["channel"],
    runtimeVersion: data["runtimeVersion"],
    renderer: renderer ? parseRendererPayload(renderer) : null,
    app: app ? parseAppPayload(app) : null,
  }
}

function parseDesktopPolicy(payload: unknown): DesktopPolicyResponse {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid desktop OTA policy response")
  }

  const data = payload as Record<string, unknown>
  const { action, distribution } = data

  if (action !== "none" && action !== "prompt" && action !== "block") {
    throw new Error("Invalid desktop OTA policy response")
  }

  if (distribution !== "direct" && distribution !== "mas" && distribution !== "mss") {
    throw new Error("Invalid desktop OTA policy response")
  }

  return {
    action,
    targetVersion: typeof data["targetVersion"] === "string" ? data["targetVersion"] : null,
    message: typeof data["message"] === "string" ? data["message"] : null,
    distribution,
    downloadUrl: typeof data["downloadUrl"] === "string" ? data["downloadUrl"] : null,
    storeUrl: typeof data["storeUrl"] === "string" ? data["storeUrl"] : null,
    publishedAt: typeof data["publishedAt"] === "string" ? data["publishedAt"] : null,
  }
}

function parseRendererPayload(payload: unknown): DesktopRendererPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid desktop OTA manifest response")
  }

  const data = payload as Record<string, unknown>
  const { launchAsset, assets } = data

  if (
    typeof data["releaseVersion"] !== "string" ||
    typeof data["version"] !== "string" ||
    typeof data["commit"] !== "string" ||
    !launchAsset ||
    !Array.isArray(assets)
  ) {
    throw new Error("Invalid desktop OTA manifest response")
  }

  return {
    releaseVersion: data["releaseVersion"],
    version: data["version"],
    commit: data["commit"],
    launchAsset: parseManifestAsset(launchAsset),
    assets: assets.map((asset) => parseManifestAsset(asset)),
  }
}

function parseAppPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid desktop OTA manifest response")
  }

  const data = payload as Record<string, unknown>
  const { manifest, files } = data

  if (
    typeof data["releaseVersion"] !== "string" ||
    typeof data["version"] !== "string" ||
    typeof data["platform"] !== "string" ||
    !manifest ||
    !Array.isArray(files)
  ) {
    throw new Error("Invalid desktop OTA manifest response")
  }

  if (
    typeof (manifest as Record<string, unknown>)["name"] !== "string" ||
    typeof (manifest as Record<string, unknown>)["downloadUrl"] !== "string"
  ) {
    throw new TypeError("Invalid desktop OTA manifest response")
  }

  return {
    releaseVersion: data["releaseVersion"],
    version: data["version"],
    platform: data["platform"],
    releaseDate: typeof data["releaseDate"] === "string" ? data["releaseDate"] : null,
    manifest: {
      name: (manifest as Record<string, unknown>)["name"] as string,
      downloadUrl: (manifest as Record<string, unknown>)["downloadUrl"] as string,
      ...(typeof (manifest as Record<string, unknown>)["path"] === "string"
        ? { path: (manifest as Record<string, unknown>)["path"] as string }
        : {}),
    },
    files: files.map((file) => parseAppFile(file)),
  }
}

function parseManifestAsset(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid desktop OTA manifest response")
  }

  const data = payload as Record<string, unknown>
  if (
    typeof data["key"] !== "string" ||
    typeof data["hash"] !== "string" ||
    typeof data["contentType"] !== "string" ||
    typeof data["url"] !== "string"
  ) {
    throw new TypeError("Invalid desktop OTA manifest response")
  }

  return {
    key: data["key"],
    hash: data["hash"],
    contentType: data["contentType"],
    url: data["url"],
    ...(typeof data["fileExtension"] === "string" ? { fileExtension: data["fileExtension"] } : {}),
  }
}

function parseAppFile(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid desktop OTA manifest response")
  }

  const data = payload as Record<string, unknown>
  if (
    typeof data["filename"] !== "string" ||
    typeof data["sha512"] !== "string" ||
    typeof data["size"] !== "number" ||
    typeof data["downloadUrl"] !== "string"
  ) {
    throw new TypeError("Invalid desktop OTA manifest response")
  }

  return {
    filename: data["filename"],
    sha512: data["sha512"],
    size: data["size"],
    downloadUrl: data["downloadUrl"],
  }
}
