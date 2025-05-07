import * as React from "react"
import type { SvgProps } from "react-native-svg"
import Svg, { Circle, Path } from "react-native-svg"

export function OouiUserAnonymous(props: SvgProps & { size?: number; color?: string }) {
  const { size = 24, color = "currentColor", ...rest } = props
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" {...rest}>
      <Path fill={color} d="M15 2H5L4 8h12zM0 10s2 1 10 1s10-1 10-1l-4-2H4zm8 4h4v1H8z" />
      <Circle cx="6" cy="15" r="3" fill={color} />
      <Circle cx="14" cy="15" r="3" fill={color} />
    </Svg>
  )
}
