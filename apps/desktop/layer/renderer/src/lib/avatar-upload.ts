import { toast } from "sonner"

import { apiClient, apiFetch } from "./api-fetch"
import { getFetchErrorMessage } from "./error-parser"

/**
 * Upload avatar blob to server
 *
 * @param blob - The image blob to upload
 * @returns Promise<string> - The uploaded image URL
 */
export async function uploadAvatarBlob(blob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append("file", blob, "avatar.jpg")

  const res = await apiFetch<{
    url: string
  }>(apiClient.upload.avatar.$url().toString(), {
    method: "POST",

    body: formData,
  }).catch((err) => {
    toast.error(getFetchErrorMessage(err))
    throw err
  })

  return res.url
}
