import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface UpCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const UpCuteReIcon = ({ width = 24, height = 24, color = "#10161F" }: UpCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M11.476 8.258c-.271.075-.597.261-1.156.662a17.374 17.374 0 0 0-4.461 4.642c-.438.665-.497.795-.498 1.1-.003.748.766 1.211 1.442.868.186-.094.251-.161.455-.47.132-.198.382-.567.558-.82 1.015-1.466 2.518-2.949 3.954-3.899l.23-.152.23.152c1.436.95 2.939 2.433 3.954 3.899.176.253.426.622.558.82.204.309.269.376.455.47.676.343 1.445-.12 1.442-.868-.001-.305-.06-.435-.498-1.1A17.374 17.374 0 0 0 13.68 8.92c-.575-.412-.884-.587-1.175-.664-.252-.068-.781-.066-1.029.002"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
