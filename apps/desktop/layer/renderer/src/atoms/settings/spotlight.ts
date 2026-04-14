import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import type { SpotlightSettings } from "@follow/shared/spotlight"
import { defaultSpotlightSettings } from "@follow/shared/spotlight"

export const createDefaultSpotlightSettings = (): SpotlightSettings => ({
  ...defaultSpotlightSettings,
})

export const {
  useSettingKey: useSpotlightSettingKey,
  useSettingSelector: useSpotlightSettingSelector,
  setSetting: setSpotlightSetting,
  getSettings: getSpotlightSettings,
  initializeDefaultSettings: initializeDefaultSpotlightSettings,
  settingAtom: __spotlightSettingAtom,
} = createSettingAtom("spotlight", createDefaultSpotlightSettings)

export const spotlightServerSyncWhiteListKeys: (keyof SpotlightSettings)[] = ["spotlights"]
