import { useCallback, useMemo } from "react"
import type { ViewStyle } from "react-native"
import { Dimensions, useWindowDimensions } from "react-native"
import { useSafeAreaFrame } from "react-native-safe-area-context"

import { isIOS } from "./platform"

const baseWidth = 375
const baseHeight = 812
const maxResponsiveHeight = 932
const tabletMinLength = 744

// Both read the window on every call. Keeping the window object Dimensions hands out and refreshing
// it in place broke useWindowDimensions, which compares each change against that same object:
// components that mounted before the first resize or rotation never saw a later one.

/**
 * This scaleWidth is not responsive, it's just a simple scale util
 * @param size
 * @returns
 */
export const scaleWidth = (size: number) => {
  return (size / baseWidth) * Dimensions.get("window").width
}
/**
 * This scaleHeight is not responsive, it's just a simple scale util
 * @param size
 * @returns
 */
export const scaleHeight = (size: number) => {
  return (size / baseHeight) * Math.min(Dimensions.get("window").height, maxResponsiveHeight)
}
export const useScaleWidth = () => {
  const windowDim = useWindowDimensions()

  return useCallback(
    (size: number) => {
      return (size / baseWidth) * windowDim.width
    },
    [windowDim.width],
  )
}

export const useScaleHeight = () => {
  const windowDim = useWindowDimensions()

  return useCallback(
    (size: number) => {
      return (size / baseHeight) * Math.min(windowDim.height, maxResponsiveHeight)
    },
    [windowDim.height],
  )
}

/**
 * Whether a window this wide gets the tablet layout. It goes by the window, not the device: an iPad
 * window as narrow as a phone, in Split View, Slide Over or a resized window, gets the phone layout.
 */
export const isTabletLayoutWidth = (windowWidth: number) => isIOS && windowWidth >= tabletMinLength

/**
 * Whether the area a component lays out in gets the tablet layout: the window, or the side of the
 * split layout it is in, whose list gets the phone layout next to the reader.
 */
export const useIsTabletLayout = () => {
  const { width } = useSafeAreaFrame()
  return isTabletLayoutWidth(width)
}

/**
 * A centred column at most `maxWidth` wide on the tablet layout. It also leaves `gutter` on each
 * side of the window, which side margins of the same size need to fit in a narrower window.
 */
export const getReadableContainerStyle = (
  windowWidth: number,
  maxWidth: number,
  gutter = 24,
): ViewStyle | undefined => {
  if (!isTabletLayoutWidth(windowWidth)) {
    return
  }

  return {
    width: "100%",
    maxWidth: Math.max(Math.min(maxWidth, windowWidth - gutter * 2), 0),
    alignSelf: "center",
  }
}

export const useReadableContainerStyle = (maxWidth: number, gutter = 24) => {
  const { width } = useSafeAreaFrame()

  return useMemo(
    () => getReadableContainerStyle(width, maxWidth, gutter),
    [gutter, maxWidth, width],
  )
}
