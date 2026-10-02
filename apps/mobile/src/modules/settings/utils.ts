import { subscriptionSyncService } from "@follow/store/subscription/store"
import { userSyncService } from "@follow/store/user/store"
import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system/legacy"
import * as Sharing from "expo-sharing"
import { t } from "i18next"

import { getDbPath } from "@/src/database"
import { followApi } from "@/src/lib/api-client"
import { toastFetchError } from "@/src/lib/error-parser"
import { pickImage } from "@/src/lib/native/picker"
import { toast } from "@/src/lib/toast"

export const setAvatar = async () => {
  const result = await pickImage({
    fileName: "avatar.jpg",
    maxSizeKB: 290,
  })

  if (!result) return
  const { formData } = result
  const { url } = await followApi.upload
    .uploadAvatar({
      file: formData.get("file") as any,
    } as any)
    .catch((err) => {
      toastFetchError(err)
      throw err
    })

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
      toast.error(t("data_control.import_opml.no_file", { ns: "settings" }))
      return
    }

    formData.append("file", {
      uri: file.uri,
      type: file.mimeType || "application/octet-stream",
      name: file.name,
    } as FileUpload as any)

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
    const destinationUri = `${FileSystem.documentDirectory}follow.db`
    await FileSystem.copyAsync({
      from: dbPath,
      to: destinationUri,
    })

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
