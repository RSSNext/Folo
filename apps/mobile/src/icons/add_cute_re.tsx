import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface AddCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const AddCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: AddCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M11.673 4.063c-.261.08-.533.358-.612.627-.052.175-.061.641-.061 3.257V11H7.947c-3.461 0-3.33-.011-3.641.3a.96.96 0 0 0 0 1.4c.311.311.18.3 3.641.3H11v3.073c0 3.471-.014 3.307.306 3.627.18.179.458.3.694.3.237 0 .514-.12.697-.303.314-.315.303-.178.303-3.644V13h3.053c3.466 0 3.329.011 3.644-.303.183-.183.303-.46.303-.697 0-.237-.12-.514-.303-.697-.315-.314-.178-.303-3.644-.303H13V7.947c0-3.466.011-3.329-.303-3.644-.279-.279-.63-.361-1.024-.24"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
