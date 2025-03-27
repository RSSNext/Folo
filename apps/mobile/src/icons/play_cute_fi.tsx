import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface PlayCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const PlayCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: PlayCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M7.662 3.444c-.813.11-1.742.639-2.26 1.286-.254.316-.571.949-.697 1.391-.227.795-.29 1.506-.351 3.928-.05 2.028-.005 5.269.087 6.251.152 1.616.473 2.461 1.215 3.204.707.706 1.533 1.056 2.492 1.056 1.077-.001 2.036-.36 4.332-1.62 2.482-1.363 5.041-2.905 5.955-3.59.467-.35 1.027-.882 1.273-1.209a3.598 3.598 0 0 0 .693-2.488c-.131-1.394-.879-2.346-2.856-3.633-1.724-1.122-5.744-3.406-6.958-3.953-1.191-.536-2.116-.733-2.925-.623"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
