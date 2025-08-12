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

export enum AIChatPanelStyle {
  Fixed = "fixed",
  Floating = "floating",
}

const aiChatPanelStyleAtom = atom<AIChatPanelStyle>(AIChatPanelStyle.Floating)
export const useAIChatPanelStyle = () => useAtomValue(aiChatPanelStyleAtom)
export const setAIChatPanelStyle = (style: AIChatPanelStyle) => {
  jotaiStore.set(aiChatPanelStyleAtom, style)
}
export const getAIChatPanelStyle = () => jotaiStore.get(aiChatPanelStyleAtom)

// Floating panel state atoms
interface FloatingPanelState {
  width: number
  height: number
  x: number
  y: number
}

const defaultFloatingPanelState: FloatingPanelState = {
  width: 500,
  height: 600,
  x: window.innerWidth - 520, // 20px margin from right
  y: window.innerHeight - 620, // 20px margin from bottom
}

const floatingPanelStateAtom = atom<FloatingPanelState>(defaultFloatingPanelState)

export const useFloatingPanelState = () => useAtomValue(floatingPanelStateAtom)
export const setFloatingPanelState = (state: Partial<FloatingPanelState>) => {
  const currentState = jotaiStore.get(floatingPanelStateAtom)
  jotaiStore.set(floatingPanelStateAtom, { ...currentState, ...state })
}
export const getFloatingPanelState = () => jotaiStore.get(floatingPanelStateAtom)
