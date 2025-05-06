import { requireNativeView } from "expo"
import type { ViewProps } from "react-native"

export const TabBarPortalWrapper = requireNativeView<ViewProps>("TabBarPortal")
