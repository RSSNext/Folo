import { requireNativeView } from "expo"
import type { ViewProps } from "react-native"

import type { TabBarRootWrapperProps } from "./types"

export const TabBarPortalWrapper = requireNativeView<ViewProps>("TabBarPortal")

export const TabScreenWrapper = requireNativeView<ViewProps>("TabScreen")

export const TabBarRootWrapper = requireNativeView<TabBarRootWrapperProps>("TabBarRoot")
