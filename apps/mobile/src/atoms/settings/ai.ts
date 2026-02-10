import { defaultAISettings } from "@follow/shared/settings/defaults"
import type {
  AISettings,
  ByokProviderName,
  UserByokProviderConfig,
} from "@follow/shared/settings/interface"

import { createSettingAtom } from "./internal/helper"

const createDefaultSettings = (): AISettings => ({
  ...defaultAISettings,
})

export const {
  useSettingKey: useAISettingKey,
  useSettingSelector: useAISettingSelector,
  useSettingKeys: useAISettingKeys,
  setSetting: setAISetting,
  clearSettings: clearAISettings,
  initializeDefaultSettings: initializeDefaultAISettings,
  getSettings: getAISettings,
  useSettingValue: useAISettingValue,
  settingAtom: __aiSettingAtom,
} = createSettingAtom("ai", createDefaultSettings)

export const aiServerSyncWhiteListKeys: (keyof AISettings)[] = []

export const getByokProviderConfig = (provider: ByokProviderName): UserByokProviderConfig => {
  const { byok } = getAISettings()
  return byok.providers.find((item) => item.provider === provider) ?? { provider }
}
