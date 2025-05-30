import type { NativeModule } from "expo"
import { requireNativeModule } from "expo-modules-core"

import { htmlUrl } from "./constants"

declare class ISharedWebViewModule extends NativeModule<{
  onContentHeightChanged: ({ height }: { height: number }) => void
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
}
