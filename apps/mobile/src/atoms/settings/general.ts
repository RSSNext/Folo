import { defaultGeneralSettings } from "@follow/shared/settings/defaults"
import type { GeneralSettings } from "@follow/shared/settings/interface"
import type { FetchEntriesPropsSettings } from "@follow/store/entry/types"
import { getEffectiveEntrySortOrder } from "@follow/store/entry/utils"
import type { SupportedLanguages } from "@follow-app/client-sdk"
import { useMemo } from "react"

import { getDeviceLanguage } from "@/src/lib/i18n"

import { createSettingAtom } from "./internal/helper"

export const createDefaultGeneralSettings = (): GeneralSettings => {
  const deviceLanguage = getDeviceLanguage()
  return {
    ...defaultGeneralSettings,
    language: deviceLanguage,
  }
}

export const {
  useSettingKey: useGeneralSettingKey,
  useSettingSelector: useGeneralSettingSelector,
  useSettingKeys: useGeneralSettingKeys,
  setSetting: setGeneralSetting,
  clearSettings: clearGeneralSettings,
  initializeDefaultSettings: initializeDefaultGeneralSettings,
  getSettings: getGeneralSettings,
  useSettingValue: useGeneralSettingValue,

  settingAtom: __generalSettingAtom,
} = createSettingAtom("general", createDefaultGeneralSettings)

/** Device-local general settings: every other general setting syncs to the account. */
export const generalLocalOnlyKeys: (keyof GeneralSettings)[] = [
  "sendAnonymousData",
  "language",
  "appLaunchOnStartup",
  "voice",
]

export function useActionLanguage() {
  const actionLanguage = useGeneralSettingSelector((s) => s.actionLanguage)
  const language = useGeneralSettingSelector((s) => s.language)
  return (actionLanguage === "default" ? language : actionLanguage) as SupportedLanguages
}

export function getActionLanguage() {
  const { actionLanguage, language } = getGeneralSettings()
  return (actionLanguage === "default" ? language : actionLanguage) as SupportedLanguages
}

export function useHideAllReadSubscriptions() {
  const hideAllReadSubscriptions = useGeneralSettingKey("hideAllReadSubscriptions")
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  return hideAllReadSubscriptions && unreadOnly
}

export function getHideAllReadSubscriptions() {
  const { hideAllReadSubscriptions, unreadOnly } = getGeneralSettings()
  return hideAllReadSubscriptions && unreadOnly
}

export function useEffectiveEntrySortOrder({ isTimelineSource }: { isTimelineSource: boolean }) {
  const unreadOnly = useGeneralSettingKey("unreadOnly")
  const sortOrder = useGeneralSettingKey("timelineSortOrder")

  return getEffectiveEntrySortOrder({
    isTimelineSource,
    sortOrder,
    unreadOnly,
  })
}

export function useFetchEntriesSettings({
  isTimelineSource,
  unreadOnlyEnabled = true,
}: {
  isTimelineSource: boolean
  unreadOnlyEnabled?: boolean
}): FetchEntriesPropsSettings {
  const hidePrivateSubscriptionsInTimeline = useGeneralSettingKey(
    "hidePrivateSubscriptionsInTimeline",
  )
  const savedUnreadOnly = useGeneralSettingKey("unreadOnly")
  const unreadOnly = unreadOnlyEnabled && savedUnreadOnly
  const savedSortOrder = useGeneralSettingKey("timelineSortOrder")
  const sortOrder = getEffectiveEntrySortOrder({
    isTimelineSource,
    sortOrder: savedSortOrder,
    unreadOnly,
  })
  return useMemo(
    () => ({
      hidePrivateSubscriptionsInTimeline,
      unreadOnly,
      sortOrder,
    }),
    [hidePrivateSubscriptionsInTimeline, sortOrder, unreadOnly],
  )
}
