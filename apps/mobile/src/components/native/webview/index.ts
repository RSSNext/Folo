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

let prepareOnce = false
export const prepareEntryRenderWebView = () => {
  if (prepareOnce) return
  prepareOnce = true
  SharedWebViewModule.load(htmlUrl)
  // SharedWebViewModule.addListener("onContentHeightChanged", ({ height }) => {
  //   jotaiStore.set(sharedWebViewHeightAtom, height)
  // })

  SharedWebViewModule.addListener("onImagePreview", (event: ImagePreviewEvent) => {
    EventBus.dispatch("PREVIEW_IMAGE", event)
  })
}
