import * as React from "react"
import type { SvgProps } from "react-native-svg"
import Svg, { Path } from "react-native-svg"

export function PhUsersBold(props: SvgProps & { size?: number; color?: string }) {
  const { size = 24, color = "currentColor", ...rest } = props
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" {...rest}>
      <Path
        fill={color}
        d="M125.18 156.94a64 64 0 1 0-82.36 0a100.23 100.23 0 0 0-39.49 32a12 12 0 0 0 19.35 14.2a76 76 0 0 1 122.64 0a12 12 0 0 0 19.36-14.2a100.33 100.33 0 0 0-39.5-32M44 108a40 40 0 1 1 40 40a40 40 0 0 1-40-40m206.1 97.67a12 12 0 0 1-16.78-2.57A76.31 76.31 0 0 0 172 172a12 12 0 0 1 0-24a40 40 0 1 0-10.3-78.67a12 12 0 1 1-6.16-23.19a64 64 0 0 1 57.64 110.8a100.23 100.23 0 0 1 39.49 32a12 12 0 0 1-2.57 16.73"
      />
    </Svg>
  )
}
