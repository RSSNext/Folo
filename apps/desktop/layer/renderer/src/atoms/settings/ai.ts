import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultAISettings } from "@follow/shared/settings/defaults"
import type { AISettings, MCPService } from "@follow/shared/settings/interface"
import { jotaiStore } from "@follow/utils"
import { clamp } from "es-toolkit"
import { atom, useAtomValue } from "jotai"

export interface WebAISettings extends AISettings {
  panelStyle: AIChatPanelStyle
}

export const createDefaultSettings = (): WebAISettings => ({
  ...defaultAISettings,
  panelStyle: AIChatPanelStyle.Fixed,
})

export const {
  useSettingKey: useAISettingKey,
  useSettingSelector: useAISettingSelector,
  setSetting: setAISetting,
  clearSettings: clearAISettings,
  initializeDefaultSettings,
  getSettings: getAISettings,
  useSettingValue: useAISettingValue,
  settingAtom: __aiSettingAtom,
} = createSettingAtom("ai", createDefaultSettings)
export const aiServerSyncWhiteListKeys = []

////////// AI Panel Style
export enum AIChatPanelStyle {
  Fixed = "fixed",
  Floating = "floating",
}

export const useAIChatPanelStyle = () => useAISettingKey("panelStyle")
export const setAIChatPanelStyle = (style: AIChatPanelStyle) => {
  setAISetting("panelStyle", style)
}
export const getAIChatPanelStyle = () => getAISettings().panelStyle

// Floating panel state atoms
interface FloatingPanelState {
  width: number
  height: number
  x: number
  y: number
}

const DEFAULT_FLOATING_PANEL_WIDTH = 500
const DEFAULT_FLOATING_PANEL_HEIGHT = clamp(window.innerHeight * 0.9, 600, 1000)
const DEFAULT_FLOATING_PANEL_X = window.innerWidth - DEFAULT_FLOATING_PANEL_WIDTH - 20
const DEFAULT_FLOATING_PANEL_Y = window.innerHeight - DEFAULT_FLOATING_PANEL_HEIGHT - 20

const defaultFloatingPanelState: FloatingPanelState = {
  width: DEFAULT_FLOATING_PANEL_WIDTH,
  height: DEFAULT_FLOATING_PANEL_HEIGHT,
  x: DEFAULT_FLOATING_PANEL_X,
  y: DEFAULT_FLOATING_PANEL_Y,
}

const floatingPanelStateAtom = atom<FloatingPanelState>(defaultFloatingPanelState)

export const useFloatingPanelState = () => useAtomValue(floatingPanelStateAtom)
export const setFloatingPanelState = (state: Partial<FloatingPanelState>) => {
  const currentState = jotaiStore.get(floatingPanelStateAtom)
  jotaiStore.set(floatingPanelStateAtom, { ...currentState, ...state })
}
export const getFloatingPanelState = () => jotaiStore.get(floatingPanelStateAtom)

////////// AI Panel Visibility

const aiPanelVisibilityAtom = atom<boolean>(false)
export const useAIPanelVisibility = () => useAtomValue(aiPanelVisibilityAtom)
export const setAIPanelVisibility = (visibility: boolean) => {
  jotaiStore.set(aiPanelVisibilityAtom, visibility)
}
export const getAIPanelVisibility = () => jotaiStore.get(aiPanelVisibilityAtom)

////////// MCP Services
export const useMCPEnabled = () => useAISettingKey("mcpEnabled")
export const setMCPEnabled = (enabled: boolean) => {
  setAISetting("mcpEnabled", enabled)
}

export const useMCPServices = () => useAISettingKey("mcpServices")
export const addMCPService = (service: Omit<MCPService, "id">) => {
  const services = getAISettings().mcpServices
  const newService = {
    ...service,
    id: Date.now().toString(),
  }
  setAISetting("mcpServices", [...services, newService])
  return newService.id
}

export const updateMCPService = (id: string, updates: Partial<MCPService>) => {
  const services = getAISettings().mcpServices
  const updatedServices = services.map((service) =>
    service.id === id ? { ...service, ...updates } : service,
  )
  setAISetting("mcpServices", updatedServices)
}

export const removeMCPService = (id: string) => {
  const services = getAISettings().mcpServices
  const filteredServices = services.filter((service) => service.id !== id)
  setAISetting("mcpServices", filteredServices)
}

//// Enhance Init Ai Settings
export const initializeDefaultAISettings = () => {
  initializeDefaultSettings()
  if (getAISettings().panelStyle === AIChatPanelStyle.Fixed) setAIPanelVisibility(true)
}
