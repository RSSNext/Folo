import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultAISettings } from "@follow/shared/settings/defaults"
import type { AISettings } from "@follow/shared/settings/interface"

export const createDefaultSettings = (): AISettings => defaultAISettings

export const {
  useSettingKey: useAISettingKey,
  useSettingSelector: useAISettingSelector,
  setSetting: setAISetting,
  clearSettings: clearAISettings,
  initializeDefaultSettings: initializeDefaultAISettings,
  getSettings: getAISettings,
  useSettingValue: useAISettingValue,
} = createSettingAtom("AI", createDefaultSettings)
