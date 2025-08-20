import type { MCPService } from "@follow/shared/settings/interface"

import { followApi } from "~/lib/api-client"

// MCP Service API calls - these connect to the actual server endpoints via followClient
export const createMCPConnection = async (connectionData: {
  name: string
  transportType: "streamable-http" | "sse"
  url: string
  headers?: Record<string, string>
}): Promise<{ authorizationUrl?: string }> => {
  const res = await followApi.mcp.createConnection(connectionData)
  return { authorizationUrl: res.authorizationUrl }
}

export const fetchMCPConnections = async (): Promise<MCPService[]> => {
  const response = await followApi.mcp.getConnections()
  return response.data
}

export const updateMCPConnection = async (
  connectionId: string,
  updateData: {
    name?: string
    transportType?: "streamable-http" | "sse"
    url?: string
    headers?: Record<string, string>
  },
): Promise<{ authorizationUrl?: string }> => {
  const res = await followApi.mcp.updateConnection({ connectionId, ...updateData })
  return { authorizationUrl: res.authorizationUrl }
}

export const deleteMCPConnection = async (connectionId: string): Promise<void> => {
  await followApi.mcp.deleteConnection({ connectionId })
}

export const refreshMCPTools = async (connectionIds?: string[]): Promise<void> => {
  await followApi.mcp.refreshTools({ connectionIds })
}

export const getMCPTools = async (connectionId: string) => {
  const response = await followApi.mcp.getTools({ connectionId })
  return response.data
}

// Query key factory for MCP queries
export const mcpQueryKeys = {
  all: ["mcp"] as const,
  connections: () => [...mcpQueryKeys.all, "connections"] as const,
  tools: (connectionId: string) => [...mcpQueryKeys.all, "tools", connectionId] as const,
}
