import { jotaiStore } from "@follow/utils"
import type { NativeModule } from "expo"
import { requireNativeModule } from "expo-modules-core"
import { atom } from "jotai"

import { htmlUrl } from "./constants"

interface ImagePreviewEvent {
  imageUrls: string[]
  index: number
}

declare class ISharedWebViewModule extends NativeModule<{
  onContentHeightChanged: ({ height }: { height: number }) => void
  onImagePreview: (event: ImagePreviewEvent) => void
}> {
  load(url: string): void
  evaluateJavaScript(js: string): void
}

export const SharedWebViewModule = requireNativeModule<ISharedWebViewModule>("FOSharedWebView")

// Create an atom to store image preview events
export const imagePreviewEventAtom = atom<ImagePreviewEvent | null>(null)

let prepareOnce = false
export const prepareEntryRenderWebView = () => {
  if (prepareOnce) return
  prepareOnce = true
  SharedWebViewModule.load(htmlUrl)
  // SharedWebViewModule.addListener("onContentHeightChanged", ({ height }) => {
  //   jotaiStore.set(sharedWebViewHeightAtom, height)
  // })

  // Listen for image preview events
  SharedWebViewModule.addListener("onImagePreview", (event: ImagePreviewEvent) => {
    // Store the event in the atom, which will be consumed by components that use useLightbox
    jotaiStore.set(imagePreviewEventAtom, event)
  })
}
