import type { URLSchemeTemplate } from "@follow/shared/settings/interface"
import { toast } from "sonner"

import { ipcServices } from "~/lib/client"

export class URLSchemeHandler {
  private static instance: URLSchemeHandler

  static getInstance(): URLSchemeHandler {
    if (!URLSchemeHandler.instance) {
      URLSchemeHandler.instance = new URLSchemeHandler()
    }
    return URLSchemeHandler.instance
  }

  /**
   * Replace placeholders in URL scheme with actual values
   */
  private replacePlaceholders(template: string, data: Record<string, string>): string {
    let result = template

    // Replace all placeholders like [title], [url], etc.
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `[${key}]`
      const encodedValue = encodeURIComponent(value || "")
      result = result.replaceAll(placeholder, encodedValue)
    })

    return result
  }

  /**
   * Execute URL scheme with data placeholders
   */
  async executeURLScheme(
    template: URLSchemeTemplate,
    data: {
      title?: string
      url?: string
      content_html?: string
      content_markdown?: string
      summary?: string
      author?: string
      published_at?: string
      description?: string
    },
  ): Promise<void> {
    try {
      const finalScheme = this.replacePlaceholders(template.scheme, data)

      // Validate URL scheme format
      if (!finalScheme.includes("://")) {
        throw new Error("Invalid URL scheme format. Must include protocol (e.g., 'app://')")
      }

      await this.openURLScheme(finalScheme)

      // Since URL schemes don't return responses, we assume success
      toast.success("URL scheme executed successfully")
    } catch (error) {
      console.error("URL scheme execution failed:", error)
      toast.error(`URL scheme failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Platform-specific URL scheme opening
   */
  private async openURLScheme(scheme: string): Promise<void> {
    if (window.electron && ipcServices) {
      // Electron environment - use IPC service
      await ipcServices.integration.openURLScheme(scheme)
    } else {
      // Browser environment - use window.open
      // Note: This may be blocked by popup blockers for non-user-initiated actions
      const opened = window.open(scheme, "_blank")
      if (!opened) {
        throw new Error("Failed to open URL scheme. This may be blocked by popup blockers.")
      }
    }
  }

  /**
   * Check if URL scheme is supported on current platform
   */
  canExecuteURLScheme(): boolean {
    // URL schemes work in both Electron and browser contexts
    // Browser support depends on registered protocol handlers
    return true
  }

  /**
   * Get common URL scheme examples for different app types
   */
  static getExamples(): { name: string; scheme: string; description: string }[] {
    return [
      {
        name: "Obsidian",
        scheme: "obsidian://new?vault=MyVault&name=[title]&content=[content_markdown]",
        description: "Create new note in Obsidian vault",
      },
      {
        name: "Bear",
        scheme: "bear://x-callback-url/create?title=[title]&text=[content_markdown]&tags=follow",
        description: "Create new note in Bear with tags",
      },
      {
        name: "Drafts",
        scheme: "drafts://x-callback-url/create?text=[title]%0A%0A[content_markdown]",
        description: "Create new draft with title and content",
      },
      {
        name: "Things 3",
        scheme: "things:///add?title=[title]&notes=[summary]&list=Reading",
        description: "Add item to Things 3 reading list",
      },
      {
        name: "Notion",
        scheme: "notion://new?title=[title]&content=[content_markdown]",
        description: "Create new Notion page",
      },
      {
        name: "DEVONthink",
        scheme: "x-devonthink://createText?title=[title]&text=[content_markdown]&destination=Inbox",
        description: "Create new text document in DEVONthink",
      },
    ]
  }
}
