import { ACTION_LANGUAGE_KEYS } from "@follow/shared"
import i18next from "i18next"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"

import type { MobileSupportedLanguages } from "@/src/@types/constants"
import { currentSupportedLanguages } from "@/src/@types/constants"
import { setGeneralSetting, useGeneralSettingKey } from "@/src/atoms/settings/general"
import {
  NavigationBlurEffectHeaderView,
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
import { updateDayjsLocale } from "@/src/lib/i18n"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export function LanguageSelect({ settingKey }: { settingKey: "language" | "actionLanguage" }) {
  const { t: tLang } = useTranslation("lang")
  const languageMapWithTranslation = useMemo(() => {
    const languageKeys =
      settingKey === "language"
        ? (currentSupportedLanguages as MobileSupportedLanguages[])
        : ACTION_LANGUAGE_KEYS.sort(
            (a, b) => currentSupportedLanguages.indexOf(a) - currentSupportedLanguages.indexOf(b),
          )

    return languageKeys.map((key) => ({
      subLabel: settingKey === "language" ? tLang(`langs.${key}`, { lng: key }) : undefined,
      label: tLang(`langs.${key}`),
      value: key,
    }))
  }, [settingKey, tLang])
  const language = useGeneralSettingKey(settingKey)

  return (
    <Select
      value={language}
      onValueChange={(value) => {
        setGeneralSetting(settingKey, value)
        if (settingKey === "language") {
          i18next.changeLanguage(value)
          updateDayjsLocale(value)
        }
      }}
      displayValue={tLang(`langs.${language}` as any)}
      options={languageMapWithTranslation}
    />
  )
}

function LanguageSetting({ settingKey }: { settingKey: "language" | "actionLanguage" }) {
  const { t } = useTranslation("settings")

  return (
    <GroupedInsetListBaseCell>
      <Text className="text-label">
        {settingKey === "language" ? t("general.language") : t("general.action_language.label")}
      </Text>

      <View className="w-[150px]">
        <LanguageSelect settingKey={settingKey} />
      </View>
    </GroupedInsetListBaseCell>
  )
}

export const GeneralScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")

  const translation = useGeneralSettingKey("translation")
  const summary = useGeneralSettingKey("summary")
  // TODO: support autoGroup
  // const autoGroup = useGeneralSettingKey("autoGroup")
  const showUnreadOnLaunch = useGeneralSettingKey("unreadOnly")
  // const groupByDate = useGeneralSettingKey("groupByDate")
  const expandLongSocialMedia = useGeneralSettingKey("autoExpandLongSocialMedia")
  const markAsReadWhenScrolling = useGeneralSettingKey("scrollMarkUnread")
  const markAsReadWhenInView = useGeneralSettingKey("renderMarkUnread")
  const openLinksInExternalApp = useGeneralSettingKey("openLinksInExternalApp")

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.general")} />}
    >
      {/* Language */}

      <GroupedInsetListSectionHeader label={t("general.language")} marginSize="small" />
      <GroupedInsetListCard>
        <LanguageSetting settingKey="language" />
      </GroupedInsetListCard>

      {/* Content Behavior */}
      <GroupedInsetListSectionHeader label={t("general.action.title")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell label={t("general.action.summary")}>
          <Switch
            size="sm"
            value={summary}
            onValueChange={(value) => {
              setGeneralSetting("summary", value)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell label={t("general.action.translation")}>
          <Switch
            size="sm"
            value={translation}
            onValueChange={(value) => {
              setGeneralSetting("translation", value)
            }}
          />
        </GroupedInsetListCell>
        <LanguageSetting settingKey="actionLanguage" />
      </GroupedInsetListCard>

      {/* Subscriptions */}

      {/* <GroupedInsetListSectionHeader label={t("general.subscriptions")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("general.auto_group.label")}
          description={t("general.auto_group.description")}
        >
          <Switch
            size="sm"
            value={autoGroup}
            onValueChange={(value) => {
              setGeneralSetting("autoGroup", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard> */}

      {/* Timeline */}

      <GroupedInsetListSectionHeader label={t("general.timeline")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell label={t("general.show_unread_on_launch.label")}>
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
          label={t("general.auto_expand_long_social_media.label")}
          description={t("general.auto_expand_long_social_media.description")}
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

      <GroupedInsetListSectionHeader label={t("general.unread")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("general.mark_as_read.scroll.label")}
          description={t("general.mark_as_read.scroll.description")}
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
          label={t("general.mark_as_read.render.label")}
          description={t("general.mark_as_read.render.description")}
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

      <GroupedInsetListSectionHeader label={t("general.content")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell label={t("general.open_links_in_external_app.label")}>
          <Switch
            size="sm"
            value={openLinksInExternalApp}
            onValueChange={(value) => {
              setGeneralSetting("openLinksInExternalApp", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
