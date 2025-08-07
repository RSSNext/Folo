import { toast } from "sonner"

import { followApi } from "./api-client"
import { getFetchErrorMessage } from "./error-parser"

/**
 * Upload avatar blob to server
 *
 * @param blob - The image blob to upload
 * @returns Promise<string> - The uploaded image URL
 */
export async function uploadAvatarBlob(blob: Blob): Promise<string> {
  const { url } = await followApi.upload
    .uploadAvatar({
      file: blob,
    })
    .catch((err) => {
      toast.error(getFetchErrorMessage(err))
      throw err
    })

  return url
}
