import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface RightSmallSharpIconProps {
  width?: number
  height?: number
  color?: string
}

export const RightSmallSharpIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: RightSmallSharpIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="m10.64 8.82-.339.341 1.419 1.419L13.14 12l-1.42 1.42-1.42 1.42.35.35.35.35 1.77-1.77L14.54 12l-1.76-1.76c-.968-.968-1.769-1.76-1.781-1.76a4.49 4.49 0 0 0-.359.34"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
