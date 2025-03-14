import { useLocales } from "expo-localization"
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
import { LanguageMap } from "@/src/lib/language"

export const GeneralScreen = () => {
  const locales = useLocales()
  const translationLanguage = useGeneralSettingKey("translationLanguage")
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
      <View className="mt-6">
        <GroupedInsetListSectionHeader label="Language" />
        <GroupedInsetListCard>
          <GroupedInsetListBaseCell>
            <Text className="text-label">Language</Text>

            <Text className="text-label">{(locales[0]?.languageTag, "English")}</Text>
          </GroupedInsetListBaseCell>

          <GroupedInsetListBaseCell>
            <Text className="text-label">Translation Language</Text>

            <View className="w-[150px]">
              <Select
                value={translationLanguage}
                onValueChange={(value) => {
                  setGeneralSetting("translationLanguage", value)
                }}
                options={Object.values(LanguageMap)}
              />
            </View>
          </GroupedInsetListBaseCell>
        </GroupedInsetListCard>
      </View>

      {/* Subscriptions */}
      <View className="mt-8">
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
        <View className="mt-8">
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
        </View>

        {/* Unread */}
        <View className="mt-8">
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
        </View>

        {/* Content Behavior */}
        <View className="mt-8">
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
        </View>
      </View>
    </SafeNavigationScrollView>
  )
}
