import { requireNativeView } from "expo"
import type * as React from "react"
import type { ViewProps } from "react-native"

export const NativeWebView: React.ComponentType<
  ViewProps & {
    onContentHeightChange?: (e: { nativeEvent: { height: number } }) => void
    onSeekAudio?: (e: { time: number }) => void
    url?: string
  }
> = requireNativeView("FOSharedWebView")
