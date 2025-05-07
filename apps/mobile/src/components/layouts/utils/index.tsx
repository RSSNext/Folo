import Constants from "expo-constants"
import { Platform } from "react-native"

type Layout = { width: number; height: number }
/**
 * @description In order to make android header height same as ios, we need to custom this function.
 * @copyright copy from @react-navigation/elements/src/Header/getDefaultHeaderHeight.tsx
 */
export function getDefaultHeaderHeight(
  layout: Layout,
  modalPresentation: boolean,
  topInset: number,
): number {
  let headerHeight = 0

  // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
  const hasDynamicIsland = topInset > 50
  const topHeight = hasDynamicIsland ? Constants.statusBarHeight : topInset

  const isLandscape = layout.width > layout.height

  if (Platform.OS === "ios" && Platform.isPad) {
    if (modalPresentation) {
      headerHeight = 56
    } else {
      headerHeight = 50
    }
  } else {
    if (isLandscape) {
      headerHeight = 32
    } else {
      if (modalPresentation) {
        headerHeight = 56
      } else {
        headerHeight = 44
      }
    }
  }

  return headerHeight + (!modalPresentation ? topHeight : 0)
}
