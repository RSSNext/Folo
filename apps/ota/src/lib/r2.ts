import type { MirroredFile } from "./archive"

export async function putMirroredFiles(bucket: R2Bucket, files: readonly MirroredFile[]) {
  for (const file of files) {
    await bucket.put(file.key, file.body, {
      httpMetadata: {
        contentType: file.contentType,
      },
    })
  }
}
