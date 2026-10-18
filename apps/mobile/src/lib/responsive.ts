import { DeviceType } from "expo-device"
import { useCallback, useMemo } from "react"
import type { ViewStyle } from "react-native"
import { Dimensions, useWindowDimensions } from "react-native"

import { useDeviceType } from "../atoms/hooks/useDeviceType"
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

export const useIsTabletLayout = () => {
  const deviceType = useDeviceType()
  const { width, height } = useWindowDimensions()

  if (!isIOS) {
    return false
  }

  return deviceType === DeviceType.TABLET || Math.min(width, height) >= tabletMinLength
}

export const useReadableContainerStyle = (maxWidth: number, gutter = 24) => {
  const isTablet = useIsTabletLayout()
  const { width } = useWindowDimensions()

  return useMemo<ViewStyle | undefined>(() => {
    if (!isTablet) {
      return
    }

    return {
      width: "100%",
      maxWidth: Math.max(Math.min(maxWidth, width - gutter * 2), 0),
      alignSelf: "center",
    }
  }, [gutter, isTablet, maxWidth, width])
}
