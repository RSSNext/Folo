import { subscriptionSyncService } from "@follow/store/subscription/store"
import { userSyncService } from "@follow/store/user/store"
import * as DocumentPicker from "expo-document-picker"
import { File } from "expo-file-system"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { t } from "i18next"

import { getDbPath } from "@/src/database"
import { followApi } from "@/src/lib/api-client"
import { toastFetchError } from "@/src/lib/error-parser"
import { pickImage } from "@/src/lib/native/picker"
import { toast } from "@/src/lib/toast"

import { getProfileFieldError } from "./profile-validation"

export const setAvatar = async () => {
  const result = await pickImage({
    maxSizeKB: 290,
  })

  if (!result) return
  const { formData } = result
  // The SDK sends a FormData body as is, but turns a file it does not recognize as a Blob in a
  // plain object into the string "[object Object]".
  const { url } = await followApi.upload
    .uploadAvatar(formData as unknown as Parameters<typeof followApi.upload.uploadAvatar>[0])
    .catch((err) => {
      toastFetchError(err)
      throw err
    })
  // The profile keeps image URLs of up to 256 characters, so a longer one would not save
  if (getProfileFieldError("image", url)) {
    toast.error(t("profile.avatar.uploadError", { ns: "settings" }))
    return
  }

  userSyncService
    .updateProfile({
      image: url,
    })
    .then(() => {
      toast.success(t("profile.avatar.uploadSuccess", { ns: "settings" }))
    })
    .catch((err) => {
      toastFetchError(err)
    })
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
      toast.error(t("data_control.import_opml.no_file", { ns: "settings" }))
      return
    }

    // The API client sends requests with expo/fetch, which reads a file part through `bytes()`
    // and rejects React Native's `{ uri, name, type }` parts before sending anything.
    formData.append("file", new File(file.uri))

    const { data } = await followApi.subscriptions.import(formData)
    // The import is logged per feed, so the delta feed delivers exactly what was added.
    void subscriptionSyncService.refresh(undefined, { afterServerChange: true })

    const { successfulItems, conflictItems, parsedErrorItems } = data
    toast.success(
      t("data_control.import_opml.result", {
        ns: "settings",
        successful: successfulItems.length,
        conflict: conflictItems.length,
        failed: parsedErrorItems.length,
      }),
    )
  } catch (error) {
    toastFetchError(error as Error)
    console.error(error)
  }
}

export const exportLocalDatabase = async () => {
  const dbPath = getDbPath()
  try {
    // The export carries the Folo name; the local database keeps follow.db so existing data stays
    const destinationUri = `${FileSystem.documentDirectory}folo.db`
    await FileSystem.copyAsync({
      from: dbPath,
      to: destinationUri,
    })
    // Earlier exports were saved as follow.db next to it; drop that stale copy of the database
    await FileSystem.deleteAsync(`${FileSystem.documentDirectory}follow.db`, {
      idempotent: true,
    }).catch(console.error)

    await FileSystem.getInfoAsync(destinationUri)
    await Sharing.shareAsync(destinationUri, {
      UTI: "public.database",
      mimeType: "application/x-sqlite3",
      dialogTitle: t("general.export_database.label", { ns: "settings" }),
    })
  } catch (error) {
    console.error(error)
    toast.error(t("data_control.export_local_database.failed", { ns: "settings" }))
  }
}
