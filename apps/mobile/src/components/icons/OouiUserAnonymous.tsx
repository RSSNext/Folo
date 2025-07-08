import * as React from "react"
import type { SvgProps } from "react-native-svg"
import Svg, { Path } from "react-native-svg"

export function OouiUserAnonymous(props: SvgProps & { size?: number; color?: string }) {
  const { size = 24, color = "currentColor", ...rest } = props
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <Path
        fill={color}
        d="M6 2.4 4.8 9.6 0 12s2.4 1.2 12 1.2S24 12 24 12l-4.8-2.4L18 2.4Zm1.2 12A3.6 3.6 0 0 0 3.6 18a3.6 3.6 0 0 0 3.6 3.6 3.6 3.6 0 0 0 3.6-3.6h2.4a3.6 3.6 0 0 0 3.6 3.6 3.6 3.6 0 0 0 3.6-3.6 3.6 3.6 0 0 0-3.6-3.6 3.6 3.6 0 0 0-3.384 2.4h-2.822A3.6 3.6 0 0 0 7.2 14.4"
      />
    </Svg>
  )
}
