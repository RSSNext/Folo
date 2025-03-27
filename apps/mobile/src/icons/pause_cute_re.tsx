import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface PauseCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const PauseCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: PauseCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M7.673 4.063c-.244.075-.523.351-.609.603C7.006 4.836 7 5.551 7 12c0 8.032-.026 7.367.306 7.7.18.179.458.3.694.3.402 0 .827-.312.939-.69C8.993 19.13 9 18.245 9 12c0-7.991.024-7.369-.303-7.697-.279-.279-.63-.361-1.024-.24m8 0c-.244.075-.523.351-.609.603-.058.17-.064.885-.064 7.334 0 8.032-.026 7.367.306 7.7.18.179.458.3.694.3.402 0 .827-.312.939-.69.054-.18.061-1.065.061-7.31 0-7.991.024-7.369-.303-7.697-.279-.279-.63-.361-1.024-.24"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
