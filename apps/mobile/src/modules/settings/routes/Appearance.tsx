import { getUnreadAll } from "@follow/store/unread/getters"
import { themeNames } from "@shikijs/themes"
import { useTranslation } from "react-i18next"
import { useColorScheme, View } from "react-native"

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
import { Switch } from "@/src/components/ui/switch/Switch"
import { setBadgeCountAsyncWithPermission } from "@/src/lib/permission"

export const AppearanceScreen = () => {
  const { t } = useTranslation("settings")
  const showUnreadCountViewAndSubscriptionMobile = useUISettingKey(
    "showUnreadCountViewAndSubscriptionMobile",
  )
  const showUnreadCountBadgeMobile = useUISettingKey("showUnreadCountBadgeMobile")
  const hideExtraBadge = useUISettingKey("hideExtraBadge")
  const thumbnailRatio = useUISettingKey("thumbnailRatio")

  const codeThemeLight = useUISettingKey("codeHighlightThemeLight")
  const codeThemeDark = useUISettingKey("codeHighlightThemeDark")

  const colorScheme = useColorScheme()
  const readerRenderInlineStyle = useUISettingKey("readerRenderInlineStyle")
  const hideRecentReader = useUISettingKey("hideRecentReader")

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("appearance.title")} />}
    >
      <GroupedInsetListSectionHeader
        label={t("appearance.unread_count.label")}
        marginSize="small"
      />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.unread_count.badge.label")}
          description={t("appearance.unread_count.badge.description")}
        >
          <Switch
            size="sm"
            value={showUnreadCountBadgeMobile}
            onValueChange={(val) => {
              setUISetting("showUnreadCountBadgeMobile", val)
              setBadgeCountAsyncWithPermission(val ? getUnreadAll() : 0, true)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.unread_count.view_and_subscription.label")}
          description={t("appearance.unread_count.view_and_subscription.description")}
        >
          <Switch
            size="sm"
            value={showUnreadCountViewAndSubscriptionMobile}
            onValueChange={(val) => {
              setUISetting("showUnreadCountViewAndSubscriptionMobile", val)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.subscriptions")} marginSize="small" />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.hide_extra_badge.label")}
          description={t("appearance.hide_extra_badge.description")}
        >
          <Switch
            size="sm"
            value={hideExtraBadge}
            onValueChange={(val) => {
              setUISetting("hideExtraBadge", val)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.thumbnail_ratio.title")}
          description={t("appearance.thumbnail_ratio.description")}
        >
          <View className="w-[100px]">
            <Select
              options={[
                { label: "Square", value: "square" },
                { label: "Original", value: "original" },
              ]}
              value={thumbnailRatio}
              onValueChange={(val) => {
                setUISetting("thumbnailRatio", val as "square" | "original")
              }}
            />
          </View>
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label="Content" />
      <GroupedInsetListCard>
        <GroupedInsetListCell label={t("appearance.code_highlight_theme.label")}>
          <View className="w-[120px]">
            <Select
              options={themeNames.map((theme) => ({
                label: theme,
                value: theme,
              }))}
              value={colorScheme === "dark" ? codeThemeDark : codeThemeLight}
              onValueChange={(val) => {
                setUISetting(`codeHighlightTheme${colorScheme === "dark" ? "Dark" : "Light"}`, val)
              }}
            />
          </View>
        </GroupedInsetListCell>

        <GroupedInsetListCell
          label={t("appearance.reader_render_inline_style.label")}
          description={t("appearance.reader_render_inline_style.description")}
        >
          <Switch
            size="sm"
            value={readerRenderInlineStyle}
            onValueChange={(val) => {
              setUISetting("readerRenderInlineStyle", val)
            }}
          />
        </GroupedInsetListCell>

        <GroupedInsetListCell
          label={t("appearance.hide_recent_reader.label")}
          description={t("appearance.hide_recent_reader.description")}
        >
          <Switch
            size="sm"
            value={hideRecentReader}
            onValueChange={(val) => {
              setUISetting("hideRecentReader", val)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
