import { requireNativeView, requireOptionalNativeModule } from "expo"
import type { ComponentType } from "react"
import type { ViewProps } from "react-native"
import { View } from "react-native"

import { isAndroid } from "@/src/lib/platform"

/**
 * A view whose children never take focus. When the focused input goes away, Android moves focus to
 * the first view that can take it, and a WebView that takes it also keeps the keyboard open.
 * iOS does not move focus, and binaries built before the native view render a plain view.
 */
export const FocusBlockerView: ComponentType<ViewProps> =
  isAndroid && requireOptionalNativeModule("FocusBlocker")
    ? requireNativeView<ViewProps>("FocusBlocker")
    : View
