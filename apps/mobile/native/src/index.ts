import type { NativeModule } from "expo"
import { requireNativeModule } from "expo-modules-core"

export { default as SharedWebView } from "./SharedWebView"

declare class ISharedWebViewModule extends NativeModule {
  preload(url: string): void
}

export const SharedWebViewModule = requireNativeModule<ISharedWebViewModule>("FOSharedWebView")
