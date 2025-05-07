import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface Loading3CuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const Loading3CuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: Loading3CuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M11.3 2.026c-2.227.181-4.178.989-5.849 2.424-.46.395-.587.56-.651.846-.149.674.462 1.307 1.139 1.18.244-.045.399-.132.639-.355a7.99 7.99 0 0 1 3.502-1.879c.552-.137.958-.195 1.687-.238.487-.029.566-.044.728-.139.733-.43.633-1.523-.165-1.808-.139-.05-.62-.064-1.03-.031"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
