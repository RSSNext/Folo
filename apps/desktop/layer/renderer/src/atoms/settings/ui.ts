import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultUISettings } from "@follow/shared/settings/defaults"
import { enhancedUISettingKeys } from "@follow/shared/settings/enhanced"
import type { UISettings } from "@follow/shared/settings/interface"
import { jotaiStore } from "@follow/utils/jotai"
import { atom, useAtomValue } from "jotai"
import { useEventCallback } from "usehooks-ts"

import { getDefaultLanguage } from "~/lib/language"
import { DEFAULT_ACTION_ORDER } from "~/modules/customize-toolbar/constant"

import { hookEnhancedSettings } from "./general"

export const createDefaultUISettings = (): UISettings => ({
  ...defaultUISettings,
  // Action Order
  toolbarOrder: DEFAULT_ACTION_ORDER,
  // Discover
  discoverLanguage: getDefaultLanguage().startsWith("zh") ? "all" : "eng",
  accentColor: "orange",
})

const zenModeAtom = atom(false)

const {
  useSettingKey: useUISettingKeyInternal,
  useSettingSelector: useUISettingSelectorInternal,
  useSettingKeys: useUISettingKeysInternal,
  setSetting: setUISetting,
  clearSettings: clearUISettings,
  initializeDefaultSettings: initializeDefaultUISettings,
  getSettings: getUISettingsInternal,
  useSettingValue: useUISettingValueInternal,
  settingAtom: __uiSettingAtom,
} = createSettingAtom("ui", createDefaultUISettings)

const [useUISettingKey, useUISettingSelector, useUISettingKeys, getUISettings, useUISettingValue] =
  hookEnhancedSettings(
    useUISettingKeyInternal,
    useUISettingSelectorInternal,
    useUISettingKeysInternal,
    getUISettingsInternal,
    useUISettingValueInternal,

    enhancedUISettingKeys,
    defaultUISettings,
  )
export {
  __uiSettingAtom,
  clearUISettings,
  getUISettings,
  initializeDefaultUISettings,
  setUISetting,
  useUISettingKey,
  useUISettingKeys,
  useUISettingSelector,
  useUISettingValue,
}

export const uiServerSyncWhiteListKeys: (keyof UISettings)[] = [
  "uiFontFamily",
  "readerFontFamily",
  "opaqueSidebar",
  "accentColor",
  // "customCSS",
]

export const useIsZenMode = () => useAtomValue(zenModeAtom)
export const getIsZenMode = () => jotaiStore.get(zenModeAtom)

export const useSetZenMode = () => {
  return setZenMode
}
export const setZenMode = (checked: boolean) => {
  jotaiStore.set(zenModeAtom, checked)
}

export const useToggleZenMode = () => {
  const setZenMode = useSetZenMode()
  const isZenMode = useIsZenMode()
  return useEventCallback(() => {
    const newIsZenMode = !isZenMode
    document.documentElement.dataset.zenMode = newIsZenMode.toString()
    setZenMode(newIsZenMode)
  })
}

export const useRealInWideMode = () => {
  const wideMode = useUISettingKey("wideMode")
  const isZenMode = useIsZenMode()
  return wideMode || isZenMode
}
