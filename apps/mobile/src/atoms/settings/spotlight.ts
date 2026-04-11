import type { SpotlightSettings } from "@follow/shared/spotlight"
import { defaultSpotlightSettings } from "@follow/shared/spotlight"

import { createSettingAtom } from "./internal/helper"

export const createDefaultSpotlightSettings = (): SpotlightSettings => ({
  ...defaultSpotlightSettings,
})

export const {
  useSettingKey: useSpotlightSettingKey,
  useSettingSelector: useSpotlightSettingSelector,
  useSettingKeys: useSpotlightSettingKeys,
  setSetting: setSpotlightSetting,
  clearSettings: clearSpotlightSettings,
  initializeDefaultSettings: initializeDefaultSpotlightSettings,
  getSettings: getSpotlightSettings,
  useSettingValue: useSpotlightSettingValue,
  settingAtom: __spotlightSettingAtom,
} = createSettingAtom("spotlight", createDefaultSpotlightSettings)

export const spotlightServerSyncWhiteListKeys: (keyof SpotlightSettings)[] = ["spotlights"]
