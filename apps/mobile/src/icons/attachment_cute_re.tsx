import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface AttachmentCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const AttachmentCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: AttachmentCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
        d="m12.877 4.308 6.54 6.54a5.25 5.25 0 0 1 0 7.425v0a5.25 5.25 0 0 1-7.424 0l-7.954-7.954a3.501 3.501 0 0 1 0-4.952v0a3.501 3.501 0 0 1 4.952 0l7.953 7.953a1.751 1.751 0 0 1 0 2.477v0a1.751 1.751 0 0 1-2.477 0L7.22 8.55"
      />
    </Svg>
  )
}
