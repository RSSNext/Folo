export interface Env {
  OTA_KV: KVNamespace
  OTA_BUCKET: R2Bucket
  GITHUB_OWNER: string
  GITHUB_REPO: string
  GITHUB_TOKEN: string
  OTA_SYNC_TOKEN: string
  OTA_SYNC_TOKEN_HEADER: string
  OTA_CODE_SIGNING_PRIVATE_KEY?: string
}
