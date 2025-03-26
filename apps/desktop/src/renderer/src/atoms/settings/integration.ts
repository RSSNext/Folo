import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultIntegrationSettings } from "@follow/shared/settings/defaults"
import type { IntegrationSettings } from "@follow/shared/settings/interface"

export const createDefaultSettings = (): IntegrationSettings => defaultIntegrationSettings

export const {
  useSettingKey: useIntegrationSettingKey,
  useSettingSelector: useIntegrationSettingSelector,
  setSetting: setIntegrationSetting,
  clearSettings: clearIntegrationSettings,
  initializeDefaultSettings: initializeDefaultIntegrationSettings,
  getSettings: getIntegrationSettings,
  useSettingValue: useIntegrationSettingValue,
} = createSettingAtom("integration", createDefaultSettings)
