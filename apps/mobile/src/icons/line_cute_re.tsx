import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface LineCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const LineCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: LineCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M19.64 3.068c-.158.053-1.179 1.06-8.345 8.226-7.546 7.546-8.17 8.181-8.23 8.363A1.353 1.353 0 0 0 3 20c0 .405.309.826.69.939.258.077.362.077.633-.002.213-.062.367-.213 8.384-8.23 8.017-8.017 8.168-8.171 8.23-8.384.079-.271.079-.375.002-.633-.155-.523-.751-.809-1.299-.622"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
