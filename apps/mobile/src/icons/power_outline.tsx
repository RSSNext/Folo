import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface PowerOutlineIconProps {
  width?: number
  height?: number
  color?: string
}

export const PowerOutlineIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: PowerOutlineIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M8.70678 12.7184H10.4292V16.7316C10.4292 17.3225 11.1649 17.6012 11.5551 17.1552L15.7746 12.3616C16.1425 11.9436 15.8471 11.2914 15.2897 11.2914H13.5673V7.27814C13.5673 6.6873 12.8315 6.4086 12.4413 6.85452L8.22185 11.6481C7.85954 12.0662 8.15496 12.7184 8.70678 12.7184Z"
        fill={color}
      />
      <Path
        d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C6.7533 21.5 2.5 17.2467 2.5 12C2.5 6.7533 6.7533 2.5 12 2.5C17.2467 2.5 21.5 6.7533 21.5 12Z"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  )
}
