import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultAISettings } from "@follow/shared/settings/defaults"
import type { AISettings } from "@follow/shared/settings/interface"
import { jotaiStore } from "@follow/utils"
import { atom, useAtomValue } from "jotai"

export const createDefaultSettings = (): AISettings => defaultAISettings

export const {
  useSettingKey: useAISettingKey,
  useSettingSelector: useAISettingSelector,
  setSetting: setAISetting,
  clearSettings: clearAISettings,
  initializeDefaultSettings: initializeDefaultAISettings,
  getSettings: getAISettings,
  useSettingValue: useAISettingValue,
  settingAtom: __aiSettingAtom,
} = createSettingAtom("ai", createDefaultSettings)
export const aiServerSyncWhiteListKeys = []
// Local Setting for ai

const aiChatPinnedAtom = atom<boolean>(false)
export const useAIChatPinned = () => useAtomValue(aiChatPinnedAtom)
export const setAIChatPinned = (pinned: boolean) => {
  jotaiStore.set(aiChatPinnedAtom, pinned)
}
export const getAIChatPinned = () => jotaiStore.get(aiChatPinnedAtom)
