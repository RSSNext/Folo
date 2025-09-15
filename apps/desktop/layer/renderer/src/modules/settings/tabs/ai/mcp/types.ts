export interface MCPPreset {
  id: string
  name: string
  displayName: string
  icon: string // simple-icons class name
  description: string
  features: string[]

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
    description: "Connect your Notion workspace",
    features: ["Read & search pages", "Create new content", "Update existing pages"],

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
    description: "Connect your Linear workspace",
    features: ["Read & search issues", "Create new issues", "Update existing issues"],

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
    description: "Connect your GitHub repository",
    features: ["Read & search issues", "Create new issues", "Update existing issues"],

    quickSetup: false,
    authRequired: true,
    configTemplate: {
      name: "GitHub",
      transportType: "streamable-http",
      url: "https://api.githubcopilot.com/mcp",
    },
  },
]
