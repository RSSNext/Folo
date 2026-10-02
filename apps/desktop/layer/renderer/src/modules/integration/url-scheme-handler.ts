import type { URLSchemeTemplate } from "@follow/shared/settings/interface"
import { t } from "i18next"
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
        throw new Error(t("entry_actions.custom_integration.url_scheme_invalid"))
      }

      await this.openURLScheme(finalScheme)

      // Since URL schemes don't return responses, we assume success
      toast.success(t("entry_actions.custom_integration.url_scheme_success"))
    } catch (error) {
      console.error("URL scheme execution failed:", error)
      toast.error(
        t("entry_actions.custom_integration.url_scheme_failed", {
          error: error instanceof Error ? error.message : String(error),
        }),
      )
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
        throw new Error(t("entry_actions.custom_integration.url_scheme_blocked"))
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
}
