import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface LeftSmallSharpIconProps {
  width?: number
  height?: number
  color?: string
}

export const LeftSmallSharpIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: LeftSmallSharpIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M11.22 10.24 9.46 12l1.77 1.77L13 15.54l.35-.35.35-.35-1.42-1.42L10.86 12l1.42-1.42 1.419-1.419-.339-.341a4.49 4.49 0 0 0-.359-.34c-.012 0-.813.792-1.781 1.76"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
