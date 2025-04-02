import { useMobile } from "@follow/components/hooks/useMobile.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { UserRole } from "@follow/constants"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { ACTION_LANGUAGE_MAP } from "@follow/shared"
import { IN_ELECTRON } from "@follow/shared/constants"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { useCallback, useEffect } from "react"
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
import { useUserRole } from "~/atoms/user"
import { useProxyValue, useSetProxy } from "~/hooks/biz/useProxySetting"
import { useMinimizeToTrayValue, useSetMinimizeToTray } from "~/hooks/biz/useTraySetting"
import { fallbackLanguage } from "~/i18n"
import { tipcClient } from "~/lib/client"
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
export const SettingGeneral = () => {
  const { t } = useTranslation("settings")
  useEffect(() => {
    tipcClient?.getLoginItemSettings().then((settings) => {
      setGeneralSetting("appLaunchOnStartup", settings.openAtLogin)
    })
  }, [])

  const saveLoginSetting = useCallback((checked: boolean) => {
    tipcClient?.setLoginItemSettings(checked)

    setGeneralSetting("appLaunchOnStartup", checked)
  }, [])

  const defineSettingItem = useWrapEnhancedSettingItem(
    _defineSettingItem,
    WrapEnhancedSettingTab.General,
  )

  const isMobile = useMobile()
  const role = useUserRole()
  const isTrialUser = role === UserRole.Trial

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
            disabled: !tipcClient,
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
            disabled: isTrialUser,
          },
          defineSettingItem("summary", {
            label: t("general.action.summary"),
            disabled: isTrialUser,
          }),
          defineSettingItem("translation", {
            label: t("general.action.translation"),
            disabled: isTrialUser,
          }),
          ActionLanguageSelector,

          {
            type: "title",
            value: t("general.sidebar"),
          },
          defineSettingItem("autoGroup", {
            label: t("general.auto_group.label"),
            description: t("general.auto_group.description"),
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
          isMobile &&
            defineSettingItem("showQuickTimeline", {
              label: t("general.show_quick_timeline.label"),
              description: t("general.show_quick_timeline.description"),
            }),

          { type: "title", value: t("general.unread") },

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
          }),
        ]}
      />
    </div>
  )
}

const VoiceSelector = () => {
  const { t } = useTranslation("settings")

  const { data } = useQuery({
    queryFn: () => tipcClient?.getVoices(),
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
}: {
  containerClassName?: string
  contentClassName?: string
}) => {
  const { t } = useTranslation("settings")
  const { t: langT } = useTranslation("lang")
  const language = useGeneralSettingSelector((state) => state.language)

  const finalRenderLanguage = currentSupportedLanguages.includes(language)
    ? language
    : fallbackLanguage

  const [loadingLanguageLockMap] = useAtom(langLoadingLockMapAtom)

  const isMobile = useMobile()

  return (
    <div className={cn("mb-3 mt-4 flex items-center justify-between", containerClassName)}>
      <span className="shrink-0 text-sm font-medium">{t("general.language")}</span>

      <ResponsiveSelect
        size="sm"
        triggerClassName="w-48"
        contentClassName={contentClassName}
        defaultValue={finalRenderLanguage}
        value={finalRenderLanguage}
        disabled={loadingLanguageLockMap[finalRenderLanguage]}
        onValueChange={(value) => {
          setGeneralSetting("language", value as string)
        }}
        renderItem={useTypeScriptHappyCallback(
          (item) => {
            const lang = item.value
            const percent = I18N_COMPLETENESS_MAP[lang]

            const languageName =
              langT(`langs.${lang}` as any) === `langs.${lang}`
                ? defaultResources[lang].lang.name
                : langT(`langs.${lang}` as any)

            const originalLanguageName = defaultResources[lang].lang.name

            if (isMobile) {
              return `${languageName} - ${originalLanguageName} (${percent}%)`
            }
            return (
              <span className="group" key={lang}>
                <span
                  className={cn(originalLanguageName !== languageName && "group-hover:invisible")}
                >
                  {languageName}
                  {typeof percent === "number" ? (percent >= 100 ? null : ` (${percent}%)`) : null}
                </span>
                {originalLanguageName !== languageName && (
                  <span
                    className="absolute inset-0 hidden items-center pl-2 group-hover:flex"
                    key={"org"}
                  >
                    {originalLanguageName}
                  </span>
                )}
              </span>
            )
          },
          [langT],
        )}
        items={currentSupportedLanguages.map((lang) => ({
          label: langT(`langs.${lang}` as any),
          value: lang,
        }))}
      />
    </div>
  )
}

const ActionLanguageSelector = () => {
  const { t } = useTranslation("settings")
  const actionLanguage = useGeneralSettingKey("actionLanguage")
  const role = useUserRole()
  if (role === UserRole.Trial) {
    return null
  }

  return (
    <div className="mb-3 mt-4 flex items-center justify-between">
      <span className="shrink-0 text-sm font-medium">{t("general.action_language.label")}</span>
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
          ...Object.values(ACTION_LANGUAGE_MAP),
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
