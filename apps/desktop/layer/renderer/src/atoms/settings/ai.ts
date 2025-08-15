import { createSettingAtom } from "@follow/atoms/helper/setting.js"
import { defaultAISettings } from "@follow/shared/settings/defaults"
import type { AISettings, MCPService } from "@follow/shared/settings/interface"
import { jotaiStore } from "@follow/utils"
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

export const toggleMCPService = (id: string, isActive: boolean) => {
  updateMCPService(id, { isActive })
}

// MCP Service Discovery - these would connect to actual MCP server endpoints
export const discoverMCPService = async (
  baseUrl: string,
): Promise<Omit<MCPService, "id" | "isActive" | "healthStatus">> => {
  // This would make an actual HTTP request to discover OAuth endpoints
  // For now, return a mock structure
  return {
    name: baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    baseUrl,
    mcpEndpoint: `${baseUrl}/mcp`,
    authorizationEndpoint: `${baseUrl}/oauth/authorize`,
    tokenEndpoint: `${baseUrl}/oauth/token`,
    clientId: "follow-app", // This would come from the discovery response
    requiredScopes: "mcp:read mcp:write",
  }
}

export const connectMCPService = async (serviceId: string): Promise<boolean> => {
  // This would handle OAuth flow and update connection status
  updateMCPService(serviceId, {
    connectionStatus: "connecting",
    lastError: undefined,
  })

  try {
    // OAuth flow would happen here
    // For now, simulate connection
    await new Promise((resolve) => setTimeout(resolve, 1000))

    updateMCPService(serviceId, {
      connectionStatus: "connected",
      isConnected: true,
      healthStatus: "healthy",
    })
    return true
  } catch (error) {
    updateMCPService(serviceId, {
      connectionStatus: "error",
      isConnected: false,
      lastError: error instanceof Error ? error.message : "Connection failed",
    })
    return false
  }
}

//// Enhance Init Ai Settings
export const initializeDefaultAISettings = () => {
  initializeDefaultSettings()
  if (getAISettings().panelStyle === AIChatPanelStyle.Fixed) setAIPanelVisibility(true)
}
