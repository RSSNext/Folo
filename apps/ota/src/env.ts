type KVNamespace = Record<string, unknown>

type R2Bucket = Record<string, unknown>

export interface Env {
  OTA_KV: KVNamespace
  OTA_BUCKET: R2Bucket
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_TOKEN: string
  OTA_SYNC_TOKEN: string
  OTA_SYNC_TOKEN_HEADER: string
}
