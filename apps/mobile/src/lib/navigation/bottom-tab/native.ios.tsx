import { requireNativeView } from "expo"
import type { ViewProps } from "react-native"

import type { TabBarRootWrapperProps } from "./types"

export const TabBarPortalWrapper = requireNativeView<ViewProps>("TabBarPortal")

export type TabScreenNativeProps = ViewProps & { title?: string }

export const TabScreenWrapper = requireNativeView<TabScreenNativeProps>("TabScreen")

export const TabBarRootWrapper = requireNativeView<TabBarRootWrapperProps>("TabBarRoot")
