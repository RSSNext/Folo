import type { FC } from "react"
import type { ActivityIndicatorProps } from "react-native"
import { ActivityIndicator, Platform } from "react-native"

import { RotateableLoading } from "../../common/RotateableLoading"

export const PlatformActivityIndicator: FC<
  Omit<ActivityIndicatorProps, "color"> & {
    color?: string
  }
> = (props) => {
  return Platform.OS === "ios" ? (
    <ActivityIndicator {...props} />
  ) : (
    <RotateableLoading
      className={props.className}
      style={props.style}
      color={props.color}
      size={props.size === "small" ? 20 : 36}
    />
  )
}
