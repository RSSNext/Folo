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
    SharedWebViewModule.dispatch?.("setCodeTheme", JSON.stringify({ light, dark }))
  },

  /**
   * Set the current entry data in WebView
   */
  setEntry(entry?: EntryModel | null): void {
    if (!entry) return
    const json = JSON.stringify(entry)
    SharedWebViewModule.dispatch?.("setEntry", json)
  },

  /**
   * Set root font size for the WebView
   */
  setRootFontSize(size = 16): void {
    SharedWebViewModule.dispatch?.("setRootFontSize", JSON.stringify(size))
  },

  /**
   * Toggle media display in WebView
   */
  setNoMedia(value: boolean): void {
    SharedWebViewModule.dispatch?.("setNoMedia", JSON.stringify(value))
  },

  /**
   * Set reader render inline style preference
   */
  setReaderRenderInlineStyle(value: boolean): void {
    SharedWebViewModule.dispatch?.("setReaderRenderInlineStyle", JSON.stringify(value))
  },

  /**
   * Execute custom JavaScript code in WebView
   */
  executeScript(script: string): void {
    SharedWebViewModule.dispatch?.("executeScript", JSON.stringify(script))
  },

  /**
   * Load a URL in the WebView
   */
  loadUrl(url: string): void {
    SharedWebViewModule.load(url)
  },
}
