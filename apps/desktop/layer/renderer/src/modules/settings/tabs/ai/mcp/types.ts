export interface MCPPreset {
  id: string
  name: string
  displayName: string
  icon: string // simple-icons class name
  description: string
  features: string[]
  category: "popular" | "productivity" | "development" | "other"
  authRequired: boolean
  configTemplate: {
    name: string
    transportType: "streamable-http" | "sse"
    url: string
  }
}

export const MCP_PRESETS: MCPPreset[] = [
  {
    id: "notion",
    name: "notion",
    displayName: "Notion",
    icon: "i-simple-icons-notion",
    description: "Connect your Notion workspace",
    features: ["Read & search pages", "Create new content", "Update existing pages"],
    category: "popular",
    authRequired: true,
    configTemplate: {
      name: "Notion",
      transportType: "sse",
      url: "https://api.notion.com/v1/mcp",
    },
  },
]
