import { LANGUAGE_MAP } from "@follow/shared"
import i18next from "i18next"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import { setGeneralSetting, useGeneralSettingKey } from "@/src/atoms/settings/general"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

function LanguageSelect({ settingKey }: { settingKey: "language" | "actionLanguage" }) {
  const { t } = useTranslation("lang")
  const languageMapWithTranslation = Object.entries(LANGUAGE_MAP).map(([key, { label }]) => ({
    label: `${t(`langs.${key}` as any)} (${label})`,
    value: key,
  }))
  const language = useGeneralSettingKey(settingKey)

  return (
    <GroupedInsetListBaseCell>
      <Text className="text-label">Language</Text>

      <View className="w-[150px]">
        <Select
          value={language}
          onValueChange={(value) => {
            setGeneralSetting(settingKey, value)
            if (settingKey === "language") {
              i18next.changeLanguage(value)
            }
          }}
          displayValue={t(`langs.${language}` as any)}
          options={languageMapWithTranslation}
        />
      </View>
    </GroupedInsetListBaseCell>
  )
}

export const GeneralScreen: NavigationControllerView = () => {
  const translation = useGeneralSettingKey("translation")
  const summary = useGeneralSettingKey("summary")
  const autoGroup = useGeneralSettingKey("autoGroup")
  const showUnreadOnLaunch = useGeneralSettingKey("unreadOnly")
  // const groupByDate = useGeneralSettingKey("groupByDate")
  const expandLongSocialMedia = useGeneralSettingKey("autoExpandLongSocialMedia")
  const markAsReadWhenScrolling = useGeneralSettingKey("scrollMarkUnread")
  const markAsReadWhenInView = useGeneralSettingKey("renderMarkUnread")
  const openLinksInApp = useGeneralSettingKey("openLinksInApp")

  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="General" />
      {/* Language */}

      <GroupedInsetListSectionHeader label="Language" />
      <GroupedInsetListCard>
        <LanguageSelect settingKey="language" />
      </GroupedInsetListCard>

      {/* Content Behavior */}
      <GroupedInsetListSectionHeader label="Action" />
      <GroupedInsetListCard>
        <GroupedInsetListCell label="AI Summary">
          <Switch
            size="sm"
            value={summary}
            onValueChange={(value) => {
              setGeneralSetting("summary", value)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell label="AI Translation">
          <Switch
            size="sm"
            value={translation}
            onValueChange={(value) => {
              setGeneralSetting("translation", value)
            }}
          />
        </GroupedInsetListCell>
        <LanguageSelect settingKey="actionLanguage" />
      </GroupedInsetListCard>

      {/* Subscriptions */}

      <GroupedInsetListSectionHeader label="Subscriptions" />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label="Auto Group"
          description="Automatically group feeds by site domain."
        >
          <Switch
            size="sm"
            value={autoGroup}
            onValueChange={(value) => {
              setGeneralSetting("autoGroup", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      {/* Timeline */}

      <GroupedInsetListSectionHeader label="Timeline" />
      <GroupedInsetListCard>
        <GroupedInsetListCell label="Show unread content on launch">
          <Switch
            size="sm"
            value={showUnreadOnLaunch}
            onValueChange={(value) => {
              setGeneralSetting("unreadOnly", value)
            }}
          />
        </GroupedInsetListCell>

        {/* <GroupedInsetListCell label="Group by date" description="Group entries by date.">
              <Switch
                size="sm"
                value={groupByDate}
                onValueChange={(value) => {
                  setGeneralSetting("groupByDate", value)
                }}
              />
            </GroupedInsetListCell> */}

        <GroupedInsetListCell
          label="Expand long social media"
          description="Automatically expand social media entries containing long text."
        >
          <Switch
            size="sm"
            value={expandLongSocialMedia}
            onValueChange={(value) => {
              setGeneralSetting("autoExpandLongSocialMedia", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      {/* Unread */}

      <GroupedInsetListSectionHeader label="Unread" />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label="Mark as read when scrolling"
          description="Automatically mark entries as read when scrolled out of the view."
        >
          <Switch
            size="sm"
            value={markAsReadWhenScrolling}
            onValueChange={(value) => {
              setGeneralSetting("scrollMarkUnread", value)
            }}
          />
        </GroupedInsetListCell>

        <GroupedInsetListCell
          label="Mark as read when in the view"
          description="Automatically mark single-level entries (e.g. social media posts, pictures, video views) as read when they enter the view."
        >
          <Switch
            size="sm"
            value={markAsReadWhenInView}
            onValueChange={(value) => {
              setGeneralSetting("renderMarkUnread", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      {/* Content Behavior */}

      <GroupedInsetListSectionHeader label="Content" />
      <GroupedInsetListCard>
        <GroupedInsetListCell label="Open Links in app">
          <Switch
            size="sm"
            value={openLinksInApp}
            onValueChange={(value) => {
              setGeneralSetting("openLinksInApp", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
