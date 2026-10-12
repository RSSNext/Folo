import { getUnreadAll } from "@follow/store/unread/getters"
import { useTranslation } from "react-i18next"

import type { AppColorScheme } from "@/src/atoms/settings/ui"
import { setUISetting, useUIPaidSettingLocked, useUISettingKey } from "@/src/atoms/settings/ui"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListNavigationLink,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import { useNavigation } from "@/src/lib/navigation/hooks"
// Font size presets
import {
  requestNotificationPermission,
  setBadgeCountAsyncWithPermission,
} from "@/src/lib/permission"

import { PaidSettingCell } from "../components/PaidSettingCell"
import { ReadingScreen } from "./Reading"

const fontSizePresets = [
  {
    value: 0.8,
    key: "xs",
  },
  {
    value: 0.9,
    key: "s",
  },
  {
    value: 1,
    key: "m",
  },
  {
    value: 1.2,
    key: "l",
  },
  {
    value: 1.5,
    key: "xl",
  },
] as const

// Content font size presets (in px)
const contentFontSizePresets = [
  {
    value: 12,
    key: "xs",
  },
  {
    value: 14,
    key: "s",
  },
  {
    value: 16,
    key: "m",
  },
  {
    value: 18,
    key: "l",
  },
  {
    value: 20,
    key: "xl",
  },
] as const

const colorSchemeOptions = ["system", "light", "dark"] as const satisfies readonly AppColorScheme[]

export const AppearanceScreen = () => {
  const { t } = useTranslation("settings")
  const navigation = useNavigation()
  const colorScheme = useUISettingKey("colorScheme")
  const showUnreadCountViewAndSubscriptionMobile = useUISettingKey(
    "showUnreadCountViewAndSubscriptionMobile",
  )
  const showUnreadCountBadgeMobile = useUISettingKey("showUnreadCountBadgeMobile")
  const hideExtraBadge = useUISettingKey("hideExtraBadge")
  const isHideExtraBadgeLocked = useUIPaidSettingLocked("hideExtraBadge")
  const thumbnailRatio = useUISettingKey("thumbnailRatio")

  // Font scaling settings
  const fontScale = useUISettingKey("fontScale")
  const useSystemFontScaling = useUISettingKey("useSystemFontScaling")
  const useDifferentFontSizeForContent = useUISettingKey("useDifferentFontSizeForContent")
  const mobileContentFontSize = useUISettingKey("mobileContentFontSize")
  const selectWrapperClassName = "w-auto min-w-[96px] max-w-[44vw] shrink-0"
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("appearance.title")} />}
    >
      <GroupedInsetListSectionHeader label={t("appearance.general")} marginSize="small" />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.theme.label")}
          description={t("appearance.theme.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={colorSchemeOptions.map((option) => ({
              label: t(`appearance.theme.${option}`),
              value: option,
            }))}
            value={colorScheme ?? "system"}
            onValueChange={(val) => {
              setUISetting("colorScheme", val)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.content")} />
      <GroupedInsetListCard>
        <GroupedInsetListNavigationLink
          label={t("appearance.reading.title")}
          description={t("appearance.reading.description")}
          onPress={() => {
            navigation.pushControllerView(ReadingScreen)
          }}
        />
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.unread_count.label")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.unread_count.badge.app_icon_label")}
          description={t("appearance.unread_count.badge.app_icon_description")}
        >
          <Switch
            size="sm"
            value={showUnreadCountBadgeMobile}
            onValueChange={async (val) => {
              setUISetting("showUnreadCountBadgeMobile", val)
              if (val && !(await requestNotificationPermission())) {
                // Without the permission the badge can't show, so the switch must not stay on
                setUISetting("showUnreadCountBadgeMobile", false)
                return
              }
              void setBadgeCountAsyncWithPermission(val ? getUnreadAll() : 0, {
                skipSettingCheck: true,
              })
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
        <PaidSettingCell
          label={t("appearance.hide_extra_badge.label")}
          description={t("appearance.hide_extra_badge.description_mobile")}
          locked={isHideExtraBadgeLocked}
        >
          <Switch
            size="sm"
            value={hideExtraBadge}
            disabled={isHideExtraBadgeLocked}
            onValueChange={(val) => {
              setUISetting("hideExtraBadge", val)
            }}
          />
        </PaidSettingCell>
        <GroupedInsetListCell
          label={t("appearance.thumbnail_ratio.title")}
          description={t("appearance.thumbnail_ratio.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={[
              {
                label: t("appearance.thumbnail_ratio.square"),
                value: "square",
              },
              {
                label: t("appearance.thumbnail_ratio.original"),
                value: "original",
              },
            ]}
            value={thumbnailRatio}
            onValueChange={(val) => {
              setUISetting("thumbnailRatio", val as "square" | "original")
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={t("appearance.font_scaling.title")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("appearance.font_scaling.system.label")}
          description={t("appearance.font_scaling.system.description")}
        >
          <Switch
            size="sm"
            value={useSystemFontScaling}
            onValueChange={(val) => {
              setUISetting("useSystemFontScaling", val)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.font_scaling.scale.label")}
          description={t("appearance.font_scaling.scale.description")}
        >
          <Select
            wrapperClassName={selectWrapperClassName}
            options={fontSizePresets.map((preset) => ({
              label: t(`appearance.font_scaling.size.${preset.key}`),
              value: preset.value.toString(),
            }))}
            value={fontScale.toString()}
            onValueChange={(val) => {
              setUISetting("fontScale", Number.parseFloat(val))
            }}
            disabled={useSystemFontScaling}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("appearance.font_scaling.content_different.label")}
          description={t("appearance.font_scaling.content_different.description")}
        >
          <Switch
            size="sm"
            value={useDifferentFontSizeForContent}
            onValueChange={(val) => {
              setUISetting("useDifferentFontSizeForContent", val)
            }}
          />
        </GroupedInsetListCell>
        {useDifferentFontSizeForContent && (
          <GroupedInsetListCell
            label={t("appearance.font_scaling.content_size.label")}
            description={t("appearance.font_scaling.content_size.description")}
          >
            <Select
              wrapperClassName={selectWrapperClassName}
              options={contentFontSizePresets.map((preset) => ({
                label: t(`appearance.font_scaling.content_size.${preset.key}`),
                value: preset.value.toString(),
              }))}
              value={mobileContentFontSize.toString()}
              onValueChange={(val) => {
                setUISetting("mobileContentFontSize", Number.parseInt(val))
              }}
            />
          </GroupedInsetListCell>
        )}
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
