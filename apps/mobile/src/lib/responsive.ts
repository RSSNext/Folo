import { useCallback } from "react"
import { Dimensions, useWindowDimensions } from "react-native"

const baseWidth = 375
const baseHeight = 812
const windowDim = Dimensions.get("window")

Dimensions.addEventListener("change", ({ window }) => {
  Object.assign(windowDim, window)
})
/**
 * This scaleWidth is not responsive, it's just a simple scale util
 * @param size
 * @returns
 */
export const scaleWidth = (size: number) => {
  return (size / baseWidth) * windowDim.width
}
/**
 * This scaleHeight is not responsive, it's just a simple scale util
 * @param size
 * @returns
 */
export const scaleHeight = (size: number) => {
  return (size / baseHeight) * windowDim.height
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
      return (size / baseHeight) * windowDim.height
    },
    [windowDim.height],
  )
}
