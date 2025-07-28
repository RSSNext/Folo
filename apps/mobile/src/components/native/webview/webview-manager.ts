import type { EntryModel } from "@follow/store/entry/types"

import { SharedWebViewModule } from "./index"

/**
 * WebView JavaScript bridge manager
 * Provides a centralized way to execute JavaScript functions in the WebView
 */
export const WebViewManager = {
  /**
   * Set code highlighting themes for light and dark modes
   */
  setCodeTheme(light: string, dark: string): void {
    SharedWebViewModule.evaluateJavaScript(
      `setCodeTheme(${JSON.stringify(light)}, ${JSON.stringify(dark)})`,
    )
  },

  /**
   * Set the current entry data in WebView
   */
  setEntry(entry?: EntryModel | null): void {
    if (!entry) return

    SharedWebViewModule.evaluateJavaScript(
      `setEntry(JSON.parse(${JSON.stringify(JSON.stringify(entry))}))`,
    )
  },

  /**
   * Set root font size for the WebView
   */
  setRootFontSize(size = 16): void {
    SharedWebViewModule.evaluateJavaScript(`setRootFontSize(${size})`)
  },

  /**
   * Toggle media display in WebView
   */
  setNoMedia(value: boolean): void {
    SharedWebViewModule.evaluateJavaScript(`setNoMedia(${value})`)
  },

  /**
   * Set reader render inline style preference
   */
  setReaderRenderInlineStyle(value: boolean): void {
    SharedWebViewModule.evaluateJavaScript(`setReaderRenderInlineStyle(${value})`)
  },

  /**
   * Execute custom JavaScript code in WebView
   */
  executeScript(script: string): void {
    SharedWebViewModule.evaluateJavaScript(script)
  },

  /**
   * Load a URL in the WebView
   */
  loadUrl(url: string): void {
    SharedWebViewModule.load(url)
  },
}

// Export for backward compatibility
export const preloadWebViewEntry = WebViewManager.setEntry.bind(WebViewManager)
