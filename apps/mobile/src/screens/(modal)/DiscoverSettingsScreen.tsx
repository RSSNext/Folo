import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { setUISetting, useUISettingKey } from "@/src/atoms/settings/ui"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"

export const DiscoverSettingsScreen = () => {
  const { t } = useTranslation("settings")
  const { t: tCommon } = useTranslation("common")
  const discoverLanguage = useUISettingKey("discoverLanguage")

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("discoverFilters.title")} />}
    >
      <GroupedInsetListSectionHeader label={t("discoverFilters.filters")} marginSize="small" />
      <GroupedInsetListCard className="flex-row">
        <GroupedInsetListCell label={t("discoverFilters.language")}>
          <View className="w-[120px]">
            <Select
              options={[
                { label: tCommon("words.all"), value: "all" },
                { label: tCommon("words.english"), value: "eng" },
                { label: tCommon("words.chinese"), value: "cmn" },
                { label: tCommon("words.french"), value: "fra" },
              ]}
              value={discoverLanguage}
              onValueChange={(val) => {
                setUISetting("discoverLanguage", val as "all" | "eng" | "cmn" | "fra")
              }}
            />
          </View>
        </GroupedInsetListCell>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
