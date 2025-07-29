import type { CustomIntegration, FetchTemplate } from "@follow/shared/settings/interface"
import type { EntryModel } from "@follow/store/entry/types"
import { getSummary } from "@follow/store/summary/getters"
import { tracker } from "@follow/tracker"
import { toast } from "sonner"

import { getActionLanguage } from "~/atoms/settings/general"
import { getIntegrationSettings } from "~/atoms/settings/integration"
import { parseHtml } from "~/lib/parse-html"

import { getFetchAdapter } from "./fetch-adapter"

/**
 * Placeholder values that can be used in custom integration templates
 */
export interface PlaceholderContext {
  title: string
  url: string
  contentHtml: string
  contentMarkdown: string
  summary: string
  author: string
  publishedAt: string
  description: string
  [key: string]: string
}

/**
 * Manager class for handling custom integrations
 */
export class CustomIntegrationManager {
  /**
   * Get entry content as markdown
   */
  private static async getEntryContentAsMarkdown(entry: EntryModel): Promise<string> {
    const content = entry.content || ""
    if (!content) return ""

    try {
      const [toMarkdown, toMdast, gfmTableToMarkdown] = await Promise.all([
        import("mdast-util-to-markdown").then((m) => m.toMarkdown),
        import("hast-util-to-mdast").then((m) => m.toMdast),
        import("mdast-util-gfm-table").then((m) => m.gfmTableToMarkdown),
      ])
      return toMarkdown(toMdast(parseHtml(content).hastTree), {
        extensions: [gfmTableToMarkdown()],
      })
    } catch {
      return content
    }
  }

  /**
   * Get description with optional summary
   */
  private static getDescription(entry: EntryModel): string {
    const { saveSummaryAsDescription } = getIntegrationSettings()
    const actionLanguage = getActionLanguage()

    if (!saveSummaryAsDescription) {
      return entry.description || ""
    }
    const summary = getSummary(entry.id, actionLanguage)
    return summary?.readabilitySummary || summary?.summary || entry.description || ""
  }

  /**
   * Build placeholder context from entry
   */
  static async buildPlaceholderContext(entry: EntryModel): Promise<PlaceholderContext> {
    const markdownContent = await this.getEntryContentAsMarkdown(entry)

    return {
      title: entry.title || "",
      url: entry.url || "",
      contentHtml: entry.content || "",
      contentMarkdown: markdownContent,
      summary: this.getDescription(entry),
      author: entry.author || "",
      publishedAt: entry.publishedAt?.toISOString() || "",
      description: entry.description || "",
    }
  }

  /**
   * Get all available placeholders with their descriptions
   */
  static getAvailablePlaceholders(): Array<{ key: string; description: string; example?: string }> {
    return [
      { key: "[title]", description: "Entry title", example: "Example Article Title" },
      { key: "[url]", description: "Entry URL", example: "https://example.com/article" },
      { key: "[content_html]", description: "Entry content in HTML format" },
      { key: "[content_markdown]", description: "Entry content in Markdown format" },
      { key: "[summary]", description: "Entry summary or description" },
      { key: "[author]", description: "Entry author", example: "John Doe" },
      {
        key: "[published_at]",
        description: "Publication date in ISO format",
        example: "2024-01-01T12:00:00.000Z",
      },
      { key: "[description]", description: "Entry description" },
    ]
  }

  /**
   * Replace placeholders in a string with actual values
   */
  static replacePlaceholders(
    template: string,
    context: PlaceholderContext,
    options: {
      urlEncode?: boolean
      htmlEscape?: boolean
    } = {},
  ): string {
    let result = template

    // Define placeholder mapping
    const placeholders: Record<string, string> = {
      "[title]": context.title,
      "[url]": context.url,
      "[content_html]": context.contentHtml,
      "[content_markdown]": context.contentMarkdown,
      "[summary]": context.summary,
      "[author]": context.author,
      "[published_at]": context.publishedAt,
      "[description]": context.description,
    }

    // Replace each placeholder
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      let processedValue = value

      if (options.urlEncode) {
        processedValue = encodeURIComponent(processedValue)
      }

      if (options.htmlEscape) {
        processedValue = processedValue
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#x27;")
      }

      result = result.replaceAll(placeholder, processedValue)
    })

    return result
  }

  /**
   * Process a fetch template with placeholder replacement
   */
  static async processFetchTemplate(
    fetchTemplate: FetchTemplate,
    context: PlaceholderContext,
  ): Promise<{
    url: string
    headers: Record<string, string>
    body?: string
    method: string
  }> {
    // Process URL with URL encoding for placeholder values
    const processedUrl = this.replacePlaceholders(fetchTemplate.url, context, { urlEncode: true })

    // Process headers without URL encoding
    const processedHeaders: Record<string, string> = {}
    Object.entries(fetchTemplate.headers).forEach(([key, value]) => {
      const processedKey = this.replacePlaceholders(key, context)
      const processedValue = this.replacePlaceholders(value, context)
      processedHeaders[processedKey] = processedValue
    })

    // Process body without URL encoding
    let processedBody: string | undefined
    if (fetchTemplate.body) {
      processedBody = this.replacePlaceholders(fetchTemplate.body, context)
    }

    return {
      url: processedUrl,
      headers: processedHeaders,
      body: processedBody,
      method: fetchTemplate.method,
    }
  }

  /**
   * Execute a custom integration
   */
  static async executeIntegration(
    integration: CustomIntegration,
    entry: EntryModel,
  ): Promise<{ success: boolean; error?: string }> {
    if (!integration.enabled) {
      return { success: false, error: `${integration.name} is disabled` }
    }

    try {
      // Track integration usage
      tracker.integration({
        type: "custom",
        event: "save",
      })

      // Build placeholder context
      const context = await this.buildPlaceholderContext(entry)

      // Process fetch template
      const { url, headers, body, method } = await this.processFetchTemplate(
        integration.fetchTemplate,
        context,
      )

      // Prepare request options for fetch adapter
      const finalHeaders = { ...headers }

      // Set content-type if not already set and we have a body
      if (
        body &&
        ["POST", "PUT", "PATCH"].includes(method) &&
        !Object.keys(headers).some((key) => key.toLowerCase() === "content-type")
      ) {
        finalHeaders["Content-Type"] = "application/json"
      }

      // Execute the HTTP request using fetch adapter
      const response = await getFetchAdapter().fetch(url, {
        method: method as "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
        headers: finalHeaders,
        body: body && ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
      })

      // Check if request was successful
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      const errorMessage = (error as Error)?.message || "Unknown error"
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Execute integration with toast notifications
   */
  static async executeWithToast(integration: CustomIntegration, entry: EntryModel): Promise<void> {
    const result = await this.executeIntegration(integration, entry)

    if (result.success) {
      toast.success(`Saved to ${integration.name} successfully`, {
        duration: 3000,
      })
    } else {
      toast.error(`Failed to save to ${integration.name}: ${result.error}`, {
        duration: 3000,
      })
    }
  }

  /**
   * Validate a fetch template
   */
  static validateFetchTemplate(fetchTemplate: FetchTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!fetchTemplate.url?.trim()) {
      errors.push("URL is required")
    }

    if (!fetchTemplate.method) {
      errors.push("HTTP method is required")
    }

    if (
      fetchTemplate.method &&
      !["GET", "POST", "PUT", "PATCH", "DELETE"].includes(fetchTemplate.method)
    ) {
      errors.push("Invalid HTTP method")
    }

    try {
      if (fetchTemplate.url) {
        new URL(fetchTemplate.url.replaceAll(/\[.*?\]/g, "https://example.com"))
      }
    } catch {
      errors.push("Invalid URL format")
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get template preview with sample data
   */
  static async getTemplatePreview(
    fetchTemplate: FetchTemplate,
    sampleEntry?: Partial<EntryModel>,
  ): Promise<{
    url: string
    headers: Record<string, string>
    body?: string
    method: string
  }> {
    // Create sample context
    const sampleContext: PlaceholderContext = {
      title: sampleEntry?.title || "Sample Article Title",
      url: sampleEntry?.url || "https://example.com/article",
      contentHtml: sampleEntry?.content || "<p>This is sample HTML content</p>",
      contentMarkdown: "# Sample Article\n\nThis is sample markdown content.",
      summary: "This is a sample summary of the article content.",
      author: sampleEntry?.author || "John Doe",
      publishedAt: sampleEntry?.publishedAt?.toISOString() || new Date().toISOString(),
      description: sampleEntry?.description || "Sample article description",
    }

    return this.processFetchTemplate(fetchTemplate, sampleContext)
  }
}
