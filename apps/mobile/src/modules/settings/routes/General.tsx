import { ACTION_LANGUAGE_KEYS } from "@follow/shared"
import i18next from "i18next"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import type { MobileSupportedLanguages } from "@/src/@types/constants"
import { currentSupportedLanguages } from "@/src/@types/constants"
import { defaultResources } from "@/src/@types/default-resource"
import { setGeneralSetting, useGeneralSettingKey } from "@/src/atoms/settings/general"
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
import { updateDayjsLocale } from "@/src/lib/i18n"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export function LanguageSelect({ settingKey }: { settingKey: "language" | "actionLanguage" }) {
  const { t } = useTranslation("settings")
  const languageMapWithTranslation = useMemo(() => {
    const languageKeys =
      settingKey === "language"
        ? (currentSupportedLanguages as MobileSupportedLanguages[])
        : ACTION_LANGUAGE_KEYS.sort(
            (a, b) => currentSupportedLanguages.indexOf(a) - currentSupportedLanguages.indexOf(b),
          )

    return [
      settingKey === "actionLanguage" && {
        label: t("general.action_language.default"),
        value: "default",
      },
      ...languageKeys.map((key) => ({
        label: defaultResources[key].lang.name,
        value: key,
      })),
    ].filter((i) => typeof i !== "boolean")
  }, [settingKey, t])
  const language = useGeneralSettingKey(settingKey) as MobileSupportedLanguages | "default"

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
      displayValue={
        language === "default"
          ? t(`general.action_language.default`)
          : defaultResources[language]?.lang.name
      }
      options={languageMapWithTranslation}
    />
  )
}

function LanguageSetting({ settingKey }: { settingKey: "language" | "actionLanguage" }) {
  const { t } = useTranslation("settings")

  return (
    <GroupedInsetListCell
      label={
        settingKey === "language" ? t("general.language.title") : t("general.action_language.label")
      }
      description={
        settingKey === "language"
          ? t("general.language.description")
          : t("general.action_language.description")
      }
    >
      <View className="w-[100px]">
        <LanguageSelect settingKey={settingKey} />
      </View>
    </GroupedInsetListCell>
  )
}

function TranslationModeSetting() {
  const { t } = useTranslation("settings")
  const translationMode = useGeneralSettingKey("translationMode")

  return (
    <GroupedInsetListCell
      label={t("general.translation_mode.label")}
      description={t("general.translation_mode.description")}
    >
      <View className="w-[120px]">
        <Select
          value={translationMode}
          onValueChange={(value) => {
            setGeneralSetting("translationMode", value as "bilingual" | "translation-only")
          }}
          options={[
            { label: t("general.translation_mode.bilingual"), value: "bilingual" },
            { label: t("general.translation_mode.translation-only"), value: "translation-only" },
          ]}
        />
      </View>
    </GroupedInsetListCell>
  )
}

export const GeneralScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")

  const translation = useGeneralSettingKey("translation")
  const summary = useGeneralSettingKey("summary")
  const autoGroup = useGeneralSettingKey("autoGroup")
  const hideAllReadSubscriptions = useGeneralSettingKey("hideAllReadSubscriptions")
  const hidePrivateSubscriptionsInTimeline = useGeneralSettingKey(
    "hidePrivateSubscriptionsInTimeline",
  )
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

      <GroupedInsetListSectionHeader label={t("general.language.title")} marginSize="small" />
      <GroupedInsetListCard>
        <LanguageSetting settingKey="language" />
      </GroupedInsetListCard>

      {/* Content Behavior */}
      <GroupedInsetListSectionHeader label={t("general.action.title")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("general.action.summary.label")}
          description={t("general.action.summary.description")}
        >
          <Switch
            size="sm"
            value={summary}
            onValueChange={(value) => {
              setGeneralSetting("summary", value)
            }}
          />
        </GroupedInsetListCell>
        <GroupedInsetListCell
          label={t("general.action.translation.label")}
          description={t("general.action.translation.description")}
        >
          <Switch
            size="sm"
            value={translation}
            onValueChange={(value) => {
              setGeneralSetting("translation", value)
            }}
          />
        </GroupedInsetListCell>
        <TranslationModeSetting />
        <LanguageSetting settingKey="actionLanguage" />
      </GroupedInsetListCard>

      {/* Subscriptions */}

      <GroupedInsetListSectionHeader label={t("general.subscriptions")} />
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

        <GroupedInsetListCell
          label={t("general.hide_all_read_subscriptions.label")}
          description={t("general.hide_all_read_subscriptions.description")}
        >
          <Switch
            size="sm"
            value={hideAllReadSubscriptions}
            onValueChange={(value) => {
              setGeneralSetting("hideAllReadSubscriptions", value)
            }}
          />
        </GroupedInsetListCell>

        <GroupedInsetListCell
          label={t("general.hide_private_subscriptions_in_timeline.label")}
          description={t("general.hide_private_subscriptions_in_timeline.description")}
        >
          <Switch
            size="sm"
            value={hidePrivateSubscriptionsInTimeline}
            onValueChange={(value) => {
              setGeneralSetting("hidePrivateSubscriptionsInTimeline", value)
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      {/* Timeline */}

      <GroupedInsetListSectionHeader label={t("general.timeline")} />
      <GroupedInsetListCard>
        <GroupedInsetListCell
          label={t("general.show_unread_on_launch.label")}
          description={t("general.show_unread_on_launch.description")}
        >
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

      <GroupedInsetListSectionHeader label={t("general.mark_as_read.title")} />
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
