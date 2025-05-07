import * as FileSystem from "expo-file-system"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"

import { setDataSetting, useDataSettingKey } from "@/src/atoms/settings/data"
import {
  NavigationBlurEffectHeaderView,
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
  const { t } = useTranslation("settings")
  const sendAnonymousData = useDataSettingKey("sendAnonymousData")
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.data_control")} />}
    >
      <GroupedInsetListSectionHeader label={t("general.privacy")} marginSize="small" />

      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("general.send_anonymous_data.label")}
          description={t("general.send_anonymous_data.description")}
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

      <GroupedInsetListSectionHeader label={t("data_control.data_sources")} />
      <GroupedInsetListCard>
        <GroupedInsetListActionCell
          onPress={importOpml}
          label={t("data_control.import_opml.label")}
        />

        <GroupedInsetListActionCell
          onPress={exportLocalDatabase}
          label={t("data_control.export_local_database.label")}
        />
      </GroupedInsetListCard>

      {/* Utils */}

      <GroupedInsetListSectionHeader label={t("data_control.utils")} />

      <GroupedInsetListCard>
        <GroupedInsetListActionCell
          onPress={() => {
            Alert.alert(
              t("general.rebuild_database.title"),
              t("general.rebuild_database.warning.line1"),
              [
                {
                  text: t("general.rebuild_database.cancel"),
                  style: "cancel",
                },
                {
                  text: t("general.rebuild_database.button"),
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
          label={t("general.rebuild_database.label")}
          description={t("general.rebuild_database.description")}
        />

        <GroupedInsetListActionCell
          onPress={() => {
            Alert.alert(
              t("data_control.clean_cache.button"),
              t("data_control.clean_cache.description"),
              [
                {
                  text: t("data_control.clean_cache.cancel"),
                  style: "cancel",
                },
                {
                  text: t("data_control.clean_cache.clear"),
                  isPreferred: true,
                  onPress: async () => {
                    const cacheDir = FileSystem.cacheDirectory
                    if (cacheDir) {
                      await FileSystem.deleteAsync(cacheDir, { idempotent: true })
                    }
                    toast.success("Cache cleared")
                  },
                },
              ],
            )
          }}
          label={t("data_control.clean_cache.button")}
          description={t("data_control.clean_cache.description")}
        />
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
