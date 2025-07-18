import * as React from "react"
import type { SvgProps } from "react-native-svg"
import Svg, { Path } from "react-native-svg"

export function PhUsersBold(props: SvgProps & { size?: number; color?: string }) {
  const { size = 24, color = "currentColor", ...rest } = props
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <Path
        fill={color}
        d="M11.734 14.924a6.048 6.048 0 1 0-7.782 0A9.5 9.5 0 0 0 .22 17.948a1.134 1.134 0 0 0 1.828 1.342 7.182 7.182 0 0 1 11.59 0 1.134 1.134 0 0 0 1.83-1.342 9.5 9.5 0 0 0-3.734-3.024M4.063 10.3a3.78 3.78 0 1 1 3.78 3.78 3.78 3.78 0 0 1-3.78-3.78m19.476 9.23a1.134 1.134 0 0 1-1.585-.243 7.21 7.21 0 0 0-5.795-2.939 1.134 1.134 0 0 1 0-2.268 3.78 3.78 0 1 0-.973-7.434 1.134 1.134 0 1 1-.583-2.191 6.048 6.048 0 0 1 5.447 10.47 9.5 9.5 0 0 1 3.732 3.024 1.134 1.134 0 0 1-.243 1.581"
      />
    </Svg>
  )
}
