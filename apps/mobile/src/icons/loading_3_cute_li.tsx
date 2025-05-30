import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface Loading3CuteLiIconProps {
  width?: number
  height?: number
  color?: string
}

export const Loading3CuteLiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: Loading3CuteLiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M11.52 2.267A9.765 9.765 0 0 0 5.385 4.84c-.27.25-.345.396-.345.669 0 .686.843.986 1.32.471.165-.178.798-.675 1.169-.916 1.194-.778 2.881-1.303 4.19-1.304.44-.001.625-.055.806-.236.497-.497.109-1.314-.605-1.276l-.4.019"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
