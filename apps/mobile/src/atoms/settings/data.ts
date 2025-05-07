import type { DataSettings } from "@/src/interfaces/settings/data"

import { createSettingAtom } from "./internal/helper"

export const createDefaultSettings = (): DataSettings => ({
  sendAnonymousData: true,
})

export const {
  useSettingKey: useDataSettingKey,
  useSettingSelector: useDataSettingSelector,
  useSettingKeys: useDataSettingKeys,
  setSetting: setDataSetting,
  clearSettings: clearDataSettings,
  initializeDefaultSettings: initializeDefaultDataSettings,
  getSettings: getDataSettings,
  useSettingValue: useDataSettingValue,
} = createSettingAtom("data", createDefaultSettings)
