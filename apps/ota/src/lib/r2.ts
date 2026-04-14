import type { MirroredFile } from "./archive"

export const IMMUTABLE_ASSET_CACHE_CONTROL = "public, max-age=31536000, immutable"

export async function putMirroredFiles(bucket: R2Bucket, files: readonly MirroredFile[]) {
  for (const file of files) {
    await bucket.put(file.key, file.body, {
      httpMetadata: {
        cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
        contentType: file.contentType,
      },
    })
  }
}
