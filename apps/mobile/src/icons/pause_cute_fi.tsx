import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface PauseCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const PauseCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: PauseCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M7.58 3.047c-.733.14-1.4.821-1.537 1.57-.061.334-.061 14.432 0 14.766.147.802.829 1.456 1.652 1.584 1.051.163 2.073-.553 2.262-1.584.061-.334.061-14.432 0-14.766-.141-.768-.806-1.433-1.574-1.574a2.106 2.106 0 0 0-.803.004m8 0c-.733.14-1.4.821-1.537 1.57-.061.334-.061 14.432 0 14.766.147.802.829 1.456 1.652 1.584 1.051.163 2.073-.553 2.262-1.584.061-.334.061-14.432 0-14.766-.141-.768-.806-1.433-1.574-1.574a2.106 2.106 0 0 0-.803.004"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
