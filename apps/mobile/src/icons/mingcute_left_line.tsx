import * as React from "react"
import Svg, { G, Path } from "react-native-svg"

interface MingcuteLeftLineIconProps {
  width?: number
  height?: number
  color?: string
}

export const MingcuteLeftLineIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: MingcuteLeftLineIconProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24">
      <G fill="none" fillRule="evenodd">
        <Path d="M24 0v24H0V0h24ZM12.593 23.258l-.011.002-.071.035-.02.004-.014-.004-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01-.017.428.005.02.01.013.104.074.015.004.012-.004.104-.074.012-.016.004-.017-.017-.427c-.002-.01-.009-.017-.017-.018Zm.265-.113-.013.002-.185.093-.01.01-.003.011.018.43.005.012.008.007.201.093c.012.004.023 0 .029-.008l.004-.014-.034-.614c-.003-.012-.01-.02-.02-.022Zm-.715.002a.023.023 0 0 0-.027.006l-.006.014-.034.614c0 .012.007.02.017.024l.015-.002.201-.093.01-.008.004-.011.017-.43-.003-.012-.01-.01-.184-.092Z" />
        <Path
          fill={color}
          d="M8.293 12.707a1 1 0 0 1 0-1.414l5.657-5.657a1 1 0 1 1 1.414 1.414L10.414 12l4.95 4.95a1 1 0 0 1-1.414 1.414l-5.657-5.657Z"
        />
      </G>
    </Svg>
  )
}
