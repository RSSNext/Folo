import { EventBus } from "@follow/utils/event-bus"
import type { NativeModule } from "expo"
import { requireNativeModule } from "expo-modules-core"

import { htmlUrl } from "./constants"

export interface ImagePreviewEvent {
  imageUrls: string[]
  index: number
}

declare module "@follow/utils/event-bus" {
  export interface CustomEvent {
    PREVIEW_IMAGE: ImagePreviewEvent
  }
}

declare class ISharedWebViewModule extends NativeModule<{
  onContentHeightChanged: ({ height }: { height: number }) => void
  onImagePreview: (event: ImagePreviewEvent) => void
}> {
  load(url: string): void
  evaluateJavaScript(js: string): void
}

export const SharedWebViewModule = requireNativeModule<ISharedWebViewModule>("FOSharedWebView")

// Re-export all WebView utilities
export { usePrepareEntryRenderWebView, useWebViewEntry, useWebViewMode } from "./hooks"
export { preloadWebViewEntry, WebViewManager } from "./webview-manager"

let prepareOnce = false

/**
 * Initializes the shared WebView module with proper error handling and event listeners
 * This function is idempotent and will only execute once per app lifecycle
 */
export const prepareEntryRenderWebView = () => {
  if (prepareOnce) return

  try {
    prepareOnce = true

    if (!htmlUrl) {
      throw new Error("HTML URL is not available for WebView initialization")
    }

    SharedWebViewModule.load(htmlUrl)

    // Set up image preview event listener with error handling
    SharedWebViewModule.addListener("onImagePreview", (event: ImagePreviewEvent) => {
      EventBus.dispatch("PREVIEW_IMAGE", event)
    })
  } catch (error) {
    console.error("Failed to prepare entry render WebView:", error)
  }
}
