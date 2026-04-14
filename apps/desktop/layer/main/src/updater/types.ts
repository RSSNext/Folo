export type DesktopDistribution = "direct" | "mas" | "mss"

export interface DesktopManifestAsset {
  key: string
  hash: string
  fileExtension?: string
  contentType: string
  url: string
}

export interface DesktopRendererPayload {
  releaseVersion: string
  version: string
  commit: string
  launchAsset: DesktopManifestAsset
  assets: DesktopManifestAsset[]
}

export interface DesktopAppFile {
  filename: string
  sha512: string
  size: number
  downloadUrl: string
}

export interface DesktopAppPayload {
  releaseVersion: string
  version: string
  platform: string
  releaseDate: string | null
  manifest: {
    name: string
    path?: string
    downloadUrl: string
  }
  files: DesktopAppFile[]
}

export interface DesktopManifestResponse {
  id: string
  createdAt: string
  product: "desktop"
  channel: string
  runtimeVersion: string
  renderer: DesktopRendererPayload | null
  app: DesktopAppPayload | null
}

export interface DesktopPolicyResponse {
  action: "none" | "prompt" | "block"
  targetVersion: string | null
  message: string | null
  distribution: DesktopDistribution
  downloadUrl: string | null
  storeUrl: string | null
  publishedAt: string | null
}

export function manifestHashToHex(hash: string) {
  const normalized = hash.replaceAll("-", "+").replaceAll("_", "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  return Buffer.from(padded, "base64").toString("hex")
}
