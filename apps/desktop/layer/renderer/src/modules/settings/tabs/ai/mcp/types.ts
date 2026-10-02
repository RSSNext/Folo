export interface MCPPreset {
  id: string
  name: string
  displayName: string
  icon: string // simple-icons class name
  // i18n keys in the `ai` namespace, translated where the preset is rendered
  descriptionKey: I18nKeysForAi
  featureKeys: I18nKeysForAi[]

  quickSetup: boolean
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
    descriptionKey: "integration.mcp.preset.notion.description",
    featureKeys: [
      "integration.mcp.preset.features.read_pages",
      "integration.mcp.preset.features.create_content",
      "integration.mcp.preset.features.update_pages",
    ],

    quickSetup: true,
    authRequired: true,
    configTemplate: {
      name: "Notion",
      transportType: "streamable-http",
      url: "https://mcp.notion.com/mcp",
    },
  },
  {
    id: "linear",
    name: "linear",
    displayName: "Linear",
    icon: "i-simple-icons-linear",
    descriptionKey: "integration.mcp.preset.linear.description",
    featureKeys: [
      "integration.mcp.preset.features.read_issues",
      "integration.mcp.preset.features.create_issues",
      "integration.mcp.preset.features.update_issues",
    ],

    quickSetup: true,
    authRequired: true,
    configTemplate: {
      name: "Linear",
      transportType: "streamable-http",
      url: "https://mcp.linear.app/mcp",
    },
  },

  {
    id: "github",
    name: "github",
    displayName: "GitHub",
    icon: "i-simple-icons-github",
    descriptionKey: "integration.mcp.preset.github.description",
    featureKeys: [
      "integration.mcp.preset.features.read_issues",
      "integration.mcp.preset.features.create_issues",
      "integration.mcp.preset.features.update_issues",
    ],

    quickSetup: false,
    authRequired: true,
    configTemplate: {
      name: "GitHub",
      transportType: "streamable-http",
      url: "https://api.githubcopilot.com/mcp",
    },
  },

  {
    id: "fabric",
    name: "fabric",
    displayName: "Fabric",
    icon: tw`i-simple-icons-modelcontextprotocol`,
    descriptionKey: "integration.mcp.preset.fabric.description",
    featureKeys: [
      "integration.mcp.preset.features.read_workspaces",
      "integration.mcp.preset.features.create_notes",
      "integration.mcp.preset.features.update_notes",
    ],

    quickSetup: true,
    authRequired: true,
    configTemplate: {
      name: "Fabric AI",
      transportType: "streamable-http",
      url: "https://mcp.api.fabric.so/mcp",
    },
  },
]
