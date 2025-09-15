import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface Music2CuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const Music2CuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: Music2CuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        fill={color}
        fillRule="evenodd"
        d="m14 10.72 1.885-.628c.978-.326 2.078-.612 2.85-1.335a4 4 0 0 0 .899-1.248c.442-.961.366-2.094.366-3.125 0-.614.075-1.306-.204-1.876a2 2 0 0 0-1.53-1.103c-.577-.077-1.148.168-1.683.347-1.113.37-1.88.625-2.497 1.068a5 5 0 0 0-1.862 2.584C11.989 6.16 12 7.009 12 8.27v5.488a4.5 4.5 0 1 0 2 3.742z"
        clipRule="evenodd"
      />
    </Svg>
  )
}
