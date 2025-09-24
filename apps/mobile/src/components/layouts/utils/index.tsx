import Constants from "expo-constants"
import { Platform } from "react-native"

import { isIOS } from "@/src/lib/platform"

/**
 * @description In order to make android header height same as ios, we need to custom this function.
 * @copyright copy from @react-navigation/elements/src/Header/getDefaultHeaderHeight.tsx
 */

export function getDefaultHeaderHeight({
  landscape,
  modalPresentation,
}: {
  landscape: boolean
  modalPresentation: boolean
  topInset: number
}): number {
  let headerHeight

  const { statusBarHeight } = Constants
  // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
  const hasDynamicIsland = isIOS && statusBarHeight > 50

  if (Platform.OS === "ios") {
    if (Platform.isPad || Platform.isTV) {
      if (modalPresentation) {
        headerHeight = 56
      } else {
        headerHeight = 50
      }
    } else {
      if (modalPresentation && !landscape) {
        headerHeight = 56
      } else {
        headerHeight = hasDynamicIsland ? 50 : 44
      }
    }
  } else {
    headerHeight = 64
  }

  return headerHeight + statusBarHeight
}
