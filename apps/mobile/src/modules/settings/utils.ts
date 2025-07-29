import { userSyncService } from "@follow/store/user/store"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

import { getDbPath } from "@/src/database"
import { apiClient, apiFetch, getBizFetchErrorMessage } from "@/src/lib/api-fetch"
import { pickImage } from "@/src/lib/native/picker"
import { toast } from "@/src/lib/toast"

export const setAvatar = async () => {
  const result = await pickImage({
    fileName: "avatar.jpg",
    maxSizeKB: 290,
  })

  if (!result) return
  const { formData } = result
  const res = await apiFetch<{
    url: string
  }>(apiClient.upload.avatar.$url().toString(), {
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  }).catch((err) => {
    toast.error(getBizFetchErrorMessage(err))
    throw err
  })

  const { url } = res

  userSyncService
    .updateProfile({
      image: url,
    })
    .then(() => {
      toast.success("Avatar updated")
    })
    .catch((err) => {
      toast.error(getBizFetchErrorMessage(err))
    })
}

type FeedResponseList = {
  id: string
  url: string
  title: string | null
}[]

type FileUpload = {
  uri: string
  name: string
  type: string
}

export const importOpml = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/octet-stream", "text/x-opml"],
  })
  if (result.canceled) {
    return
  }

  try {
    const formData = new FormData()
    const file = result.assets[0]

    if (!file) {
      toast.error("No file selected")
      return
    }

    formData.append("file", {
      uri: file.uri,
      type: file.mimeType || "application/octet-stream",
      name: file.name,
    } as FileUpload as any)

    const { data } = await apiFetch<{
      data: {
        successfulItems: FeedResponseList
        conflictItems: FeedResponseList
        parsedErrorItems: FeedResponseList
      }
    }>("/subscriptions/import", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    const { successfulItems, conflictItems, parsedErrorItems } = data
    toast.success(
      `Import successful, ${successfulItems.length} feeds were imported, ${conflictItems.length} feeds were already subscribed, and ${parsedErrorItems.length} feeds failed to import.`,
    )
  } catch (error) {
    const bizError = getBizFetchErrorMessage(error as Error)
    toast.error(`Import failed${bizError ? `: ${bizError}` : ""}`)
    console.error(error)
  }
}

export const exportLocalDatabase = async () => {
  const dbPath = getDbPath()
  try {
    const destinationUri = `${FileSystem.documentDirectory}follow.db`
    await FileSystem.copyAsync({
      from: dbPath,
      to: destinationUri,
    })

    await FileSystem.getInfoAsync(destinationUri)
    await Sharing.shareAsync(destinationUri, {
      UTI: "public.database",
      mimeType: "application/x-sqlite3",
      dialogTitle: "Export Database",
    })
  } catch (error) {
    console.error(error)
    toast.error("Failed to export database")
  }
}
