import { useMobile } from "@follow/components/hooks/useMobile.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"
import { IN_ELECTRON } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useAtom } from "jotai"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useRevalidator } from "react-router"

import { currentSupportedLanguages } from "~/@types/constants"
import { defaultResources } from "~/@types/default-resource"
import { langLoadingLockMapAtom } from "~/atoms/lang"
import {
  DEFAULT_ACTION_LANGUAGE,
  setGeneralSetting,
  useGeneralSettingKey,
  useGeneralSettingSelector,
  useGeneralSettingValue,
} from "~/atoms/settings/general"
import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { useProxyValue, useSetProxy } from "~/hooks/biz/useProxySetting"
import { useMinimizeToTrayValue, useSetMinimizeToTray } from "~/hooks/biz/useTraySetting"
import { fallbackLanguage } from "~/i18n"
import { ipcServices } from "~/lib/client"
import { setTranslationCache } from "~/modules/entry-content/atoms"

import { SettingDescription, SettingInput, SettingSwitch } from "../control"
import { createSetting } from "../helper/builder"
import {
  useWrapEnhancedSettingItem,
  WrapEnhancedSettingTab,
} from "../hooks/useWrapEnhancedSettingItem"
import { SettingItemGroup } from "../section"

const { defineSettingItem: _defineSettingItem, SettingBuilder } = createSetting(
  useGeneralSettingValue,
  setGeneralSetting,
)

const saveLoginSetting = (checked: boolean) => {
  ipcServices?.setting.setLoginItemSettings({
    openAtLogin: checked,
    openAsHidden: true,
    args: ["--startup"],
  })
  setGeneralSetting("appLaunchOnStartup", checked)
}

export const SettingGeneral = () => {
  const { t } = useTranslation("settings")
  useEffect(() => {
    ipcServices?.setting.getLoginItemSettings().then((settings) => {
      if (settings) {
        setGeneralSetting("appLaunchOnStartup", settings.openAtLogin)
      }
    })
  }, [])

  const defineSettingItem = useWrapEnhancedSettingItem(
    _defineSettingItem,
    WrapEnhancedSettingTab.General,
  )

  const isMobile = useMobile()

  const { ask } = useDialog()
  const reRenderKey = useGeneralSettingKey("enhancedSettings")

  return (
    <div className="mt-4">
      <SettingBuilder
        key={reRenderKey.toString()}
        settings={[
          {
            type: "title",
            value: t("general.app"),
          },

          defineSettingItem("appLaunchOnStartup", {
            label: t("general.launch_at_login"),
            disabled: !ipcServices,
            onChange(value) {
              saveLoginSetting(value)
            },
          }),
          IN_ELECTRON && MinimizeToTraySetting,
          isMobile && StartupScreenSelector,
          LanguageSelector,

          {
            type: "title",
            value: t("general.action.title"),
          },
          defineSettingItem("summary", {
            label: t("general.action.summary.label"),
            description: t("general.action.summary.description"),
          }),
          defineSettingItem("translation", {
            label: t("general.action.translation.label"),
            description: t("general.action.translation.description"),
          }),
          TranslationModeSelector,
          ActionLanguageSelector,

          {
            type: "title",
            value: t("general.subscription"),
          },
          defineSettingItem("autoGroup", {
            label: t("general.auto_group.label"),
            description: t("general.auto_group.description"),
          }),
          defineSettingItem("hideAllReadSubscriptions", {
            label: t("general.hide_all_read_subscriptions.label"),
            description: t("general.hide_all_read_subscriptions.description"),
          }),
          defineSettingItem("hidePrivateSubscriptionsInTimeline", {
            label: t("general.hide_private_subscriptions_in_timeline.label"),
            description: t("general.hide_private_subscriptions_in_timeline.description"),
          }),

          {
            type: "title",
            value: t("general.timeline"),
          },
          defineSettingItem("unreadOnly", {
            label: t("general.show_unread_on_launch.label"),
            description: t("general.show_unread_on_launch.description"),
          }),
          defineSettingItem("groupByDate", {
            label: t("general.group_by_date.label"),
            description: t("general.group_by_date.description"),
          }),
          defineSettingItem("autoExpandLongSocialMedia", {
            label: t("general.auto_expand_long_social_media.label"),
            description: t("general.auto_expand_long_social_media.description"),
          }),
          defineSettingItem("dimRead", {
            label: t("general.dim_read.label"),
            description: t("general.dim_read.description"),
          }),
          isMobile &&
            defineSettingItem("showQuickTimeline", {
              label: t("general.show_quick_timeline.label"),
              description: t("general.show_quick_timeline.description"),
            }),

          { type: "title", value: t("general.mark_as_read.title") },

          defineSettingItem("scrollMarkUnread", {
            label: t("general.mark_as_read.scroll.label"),
            description: t("general.mark_as_read.scroll.description"),
          }),
          !isMobile &&
            defineSettingItem("hoverMarkUnread", {
              label: t("general.mark_as_read.hover.label"),
              description: t("general.mark_as_read.hover.description"),
            }),
          defineSettingItem("renderMarkUnread", {
            label: t("general.mark_as_read.render.label"),
            description: t("general.mark_as_read.render.description"),
          }),

          { type: "title", value: "TTS" },

          IN_ELECTRON && VoiceSelector,

          { type: "title", value: t("general.network") },
          IN_ELECTRON && NettingSetting,

          { type: "title", value: t("general.advanced") },

          defineSettingItem("enhancedSettings", {
            label: t("general.enhanced.label"),
            description: t("general.enhanced.description"),
            onChangeGuard(value) {
              if (value) {
                ask({
                  variant: "danger",
                  title: t("general.enhanced.enable.modal.title"),
                  message: t("general.enhanced.enable.modal.description"),
                  confirmText: t("general.enhanced.enable.modal.confirm"),
                  cancelText: t("general.enhanced.enable.modal.cancel"),
                  onConfirm: () => {
                    setGeneralSetting("enhancedSettings", value)
                  },
                })
                return "handled"
              }
            },
          }),
        ]}
      />
    </div>
  )
}

const VoiceSelector = () => {
  const { t } = useTranslation("settings")

  const { data } = useQuery({
    queryFn: () => ipcServices?.reader.getVoices(),
    queryKey: ["voices"],
    meta: {
      persist: true,
    },
  })

  const voice = useGeneralSettingKey("voice")

  return (
    <div className="-mt-1 mb-3 flex items-center justify-between">
      <span className="shrink-0 text-sm font-medium">{t("general.voices")}</span>
      <ResponsiveSelect
        size="sm"
        triggerClassName="w-48"
        defaultValue={voice}
        value={voice}
        onValueChange={(value) => {
          setGeneralSetting("voice", value)
        }}
        items={
          data?.map((item) => ({
            label: item.FriendlyName,
            value: item.ShortName,
          })) ?? []
        }
      />
    </div>
  )
}

export const LanguageSelector = ({
  containerClassName,
  contentClassName,

  showDescription = true,
}: {
  containerClassName?: string
  contentClassName?: string
  showDescription?: boolean
}) => {
  const { t } = useTranslation("settings")
  const language = useGeneralSettingSelector((state) => state.language)

  const finalRenderLanguage = currentSupportedLanguages.includes(language)
    ? language
    : fallbackLanguage

  const [loadingLanguageLockMap] = useAtom(langLoadingLockMapAtom)

  const isMobile = useMobile()

  return (
    <div className={cn("mb-3 mt-4 flex w-full items-center", containerClassName)}>
      <div className="flex grow flex-col gap-1">
        <span className="shrink-0 text-sm font-medium">{t("general.language.title")}</span>
        {showDescription && (
          <SettingDescription>{t("general.language.description")}</SettingDescription>
        )}
      </div>

      <ResponsiveSelect
        size="sm"
        triggerClassName="w-48"
        contentClassName={contentClassName}
        defaultValue={finalRenderLanguage}
        value={finalRenderLanguage}
        disabled={loadingLanguageLockMap[finalRenderLanguage]}
        onValueChange={(value) => {
          setGeneralSetting("language", value as string)
          dayjs.locale(value)
        }}
        renderItem={useTypeScriptHappyCallback((item) => {
          const lang = item.value
          const percent = I18N_COMPLETENESS_MAP[lang]

          const originalLanguageName = defaultResources[lang].lang.name

          if (isMobile) {
            return `${originalLanguageName} (${percent}%)`
          }
          return (
            <span className="group" key={lang}>
              <span>
                {originalLanguageName}
                {typeof percent === "number" ? (percent >= 100 ? null : ` (${percent}%)`) : null}
              </span>
            </span>
          )
        }, [])}
        items={currentSupportedLanguages.map((lang) => ({
          label: `langs.${lang}`,
          value: lang,
        }))}
      />
    </div>
  )
}

const TranslationModeSelector = () => {
  const { t } = useTranslation("settings")
  const translationMode = useGeneralSettingKey("translationMode")

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <span className="shrink-0 text-sm font-medium">{t("general.translation_mode.label")}</span>
        <ResponsiveSelect
          size="sm"
          triggerClassName="w-48"
          defaultValue={translationMode}
          value={translationMode}
          onValueChange={(value) => {
            setGeneralSetting("translationMode", value as "bilingual" | "translation-only")
          }}
          items={[
            { label: t("general.translation_mode.bilingual"), value: "bilingual" },
            { label: t("general.translation_mode.translation-only"), value: "translation-only" },
          ]}
        />
      </div>
      <SettingDescription>{t("general.translation_mode.description")}</SettingDescription>
    </>
  )
}

const ActionLanguageSelector = () => {
  const { t } = useTranslation("settings")
  const actionLanguage = useGeneralSettingKey("actionLanguage")

  return (
    <div className="mb-3 mt-4 flex w-full gap-1">
      <div className="flex grow flex-col gap-1">
        <span className="shrink-0 text-sm font-medium">{t("general.action_language.label")}</span>
        <SettingDescription>{t("general.action_language.description")}</SettingDescription>
      </div>

      <ResponsiveSelect
        size="sm"
        triggerClassName="w-48"
        defaultValue={actionLanguage}
        value={actionLanguage}
        onValueChange={(value) => {
          setGeneralSetting("actionLanguage", value)
          setTranslationCache({})
        }}
        items={[
          { label: t("general.action_language.default"), value: DEFAULT_ACTION_LANGUAGE },
          ...Object.values(ACTION_LANGUAGE_MAP).map((item) => ({
            label: defaultResources[item.value].lang.name,
            value: item.value,
          })),
        ]}
      />
    </div>
  )
}

const NettingSetting = () => {
  const { t } = useTranslation("settings")
  const proxyConfig = useProxyValue()
  const setProxyConfig = useSetProxy()

  return (
    <SettingItemGroup>
      <SettingInput
        type="text"
        label={t("general.proxy.label")}
        labelClassName="w-[150px]"
        value={proxyConfig}
        onChange={(event) => setProxyConfig(event.target.value.trim())}
      />
      <SettingDescription>{t("general.proxy.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

const MinimizeToTraySetting = () => {
  const { t } = useTranslation("settings")
  const minimizeToTray = useMinimizeToTrayValue()
  const setMinimizeToTray = useSetMinimizeToTray()
  return (
    <SettingItemGroup>
      <SettingSwitch
        checked={minimizeToTray}
        className="mt-4"
        onCheckedChange={setMinimizeToTray}
        label={t("general.minimize_to_tray.label")}
      />
      <SettingDescription>{t("general.minimize_to_tray.description")}</SettingDescription>
    </SettingItemGroup>
  )
}

const StartupScreenSelector = () => {
  const { t } = useTranslation("settings")
  const startupScreen = useGeneralSettingKey("startupScreen")
  const revalidator = useRevalidator()
  const { pathname } = useLocation()

  return (
    <div className="mb-3 mt-4 flex items-center justify-between">
      <span className="shrink-0 text-sm font-medium">{t("general.startup_screen.title")}</span>
      <ResponsiveSelect
        size="sm"
        items={[
          {
            label: t("general.startup_screen.timeline"),
            value: "timeline",
          },
          {
            label: t("general.startup_screen.subscription"),
            value: "subscription",
          },
        ]}
        triggerClassName="w-48"
        defaultValue={startupScreen}
        value={startupScreen}
        onValueChange={(value) => {
          setGeneralSetting("startupScreen", value as "subscription" | "timeline")
          if (value === "timeline" && pathname === "/") {
            revalidator.revalidate()
          }
        }}
      />
    </div>
  )
}
