import * as FileSystem from "expo-file-system"
import { Alert } from "react-native"

import { setDataSetting, useDataSettingKey } from "@/src/atoms/settings/data"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListActionCell,
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import { getDbPath } from "@/src/database"
import { toast } from "@/src/lib/toast"

import { exportLocalDatabase, importOpml } from "../utils"

export const DataScreen = () => {
  const sendAnonymousData = useDataSettingKey("sendAnonymousData")
  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Data" />

      <GroupedInsetListSectionHeader label="Privacy" />

      <GroupedInsetListCard>
        <GroupedInsetListCell
          label="Send anonymous data"
          description="By opting to send anonymized telemetry data, you contribute to improving the overall user experience of Folo."
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

      {/* Data Sources */}

      <GroupedInsetListSectionHeader label="Data Sources" />
      <GroupedInsetListCard>
        <GroupedInsetListActionCell onPress={importOpml} label="Import subscriptions from OPML" />

        <GroupedInsetListActionCell onPress={exportLocalDatabase} label="Export local database" />
      </GroupedInsetListCard>

      {/* Utils */}

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
    </SafeNavigationScrollView>
  )
}
