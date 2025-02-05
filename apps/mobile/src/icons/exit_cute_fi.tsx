import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface ExitCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const ExitCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: ExitCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path fill="#fff" fillOpacity={0.01} d="M24 0v24H0V0z" />
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeWidth={3}
        d="M12.5 12H20m-2.5-2.828a8.616 8.616 0 0 1 2.478 2.307.89.89 0 0 1 0 1.042A8.631 8.631 0 0 1 17.5 14.83M12.5 3.5c-3.44.002-5.21.053-6.328 1.171C5 5.843 5 7.73 5 11.5v1c0 3.771 0 5.657 1.172 6.828C7.29 20.447 9.06 20.498 12.5 20.5"
      />
    </Svg>
  )
}
