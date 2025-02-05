import * as DocumentPicker from "expo-document-picker"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { Alert, View } from "react-native"

import { setDataSetting, useDataSettingKey } from "@/src/atoms/settings/data"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/common/SafeNavigationScrollView"
import {
  GroupedInsetListActionCell,
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import { getDbPath } from "@/src/database"
import { apiFetch, getBizFetchErrorMessage } from "@/src/lib/api-fetch"
import { toast } from "@/src/lib/toast"

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

export const DataScreen = () => {
  const sendAnonymousData = useDataSettingKey("sendAnonymousData")
  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Data" />
      <View className="mt-6">
        <GroupedInsetListSectionHeader label="Privacy" />

        <GroupedInsetListCard>
          <GroupedInsetListCell
            label="Send anonymous data"
            description="By opting to send anonymized telemetry data, you contribute to improving the overall user experience of Follow."
          >
            <Switch
              size="sm"
              value={sendAnonymousData}
              onValueChange={(val) => {
                setDataSetting("sendAnonymousData", val)
              }}
            />
          </GroupedInsetListCell>
        </GroupedInsetListCard>
      </View>

      {/* Data Sources */}
      <View className="mt-6">
        <GroupedInsetListSectionHeader label="Data Sources" />
        <GroupedInsetListCard>
          <GroupedInsetListActionCell
            onPress={async () => {
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
                toast.info(
                  `Import successful, ${successfulItems.length} feeds were imported, ${conflictItems.length} feeds were already subscribed, and ${parsedErrorItems.length} feeds failed to import.`,
                )
              } catch (error) {
                const bizError = getBizFetchErrorMessage(error as Error)
                toast.error(`Import failed${bizError ? `: ${bizError}` : ""}`)
                console.error(error)
              }
            }}
            label="Import subscriptions from OPML"
          />

          <GroupedInsetListActionCell
            onPress={async () => {
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
            }}
            label="Export local database"
          />
        </GroupedInsetListCard>
      </View>

      {/* Utils */}

      <View className="mt-6">
        <GroupedInsetListSectionHeader label="Utils" />

        <GroupedInsetListCard>
          <GroupedInsetListActionCell
            onPress={() => {
              Alert.alert(
                "Rebuild database?",
                "This will delete all your offline cached data and rebuild the database, and after that the app will reload.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Rebuild",
                    style: "destructive",
                    onPress: async () => {
                      const dbPath = getDbPath()
                      await FileSystem.deleteAsync(dbPath)
                      await expo.reloadAppAsync("Clear Sqlite Data")
                    },
                  },
                ],
              )
            }}
            label="Rebuild database"
            description="If you are experiencing rendering issues, rebuilding the database may solve them."
          />

          <GroupedInsetListActionCell
            onPress={() => {
              Alert.alert("Clear cache?", "This will clear all temporary files and cached data.", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Clear",

                  isPreferred: true,
                  onPress: async () => {
                    const cacheDir = FileSystem.cacheDirectory
                    if (cacheDir) {
                      await FileSystem.deleteAsync(cacheDir, { idempotent: true })
                    }
                    toast.success("Cache cleared")
                  },
                },
              ])
            }}
            label="Clear cache"
            description="Clear temporary files and cached data to free up storage space."
          />
        </GroupedInsetListCard>
      </View>
    </SafeNavigationScrollView>
  )
}
