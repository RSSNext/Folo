import * as React from "react"
import { RadialGradient, Stop } from "react-native-svg"

import type { GradientOrigin, RadialGradientProps } from "./types"

interface SVGRadialGradientProps extends RadialGradientProps {
  id: string
  size: number
  origin?: GradientOrigin
}

export function SVGRadialGradient({
  id,
  size,
  origin = [0, 0],
  center = [0.5, 0.5],
  radius = [1, 1],
  colors = ["black", "white"],
  locations = [0, 1],
}: SVGRadialGradientProps) {
  return (
    <RadialGradient
      id={id}
      gradientUnits="userSpaceOnUse"
      cx={center[0] * size + origin[0]}
      cy={center[1] * size + origin[1]}
      rx={radius[0] * size}
      ry={radius[1] * size}
    >
      {colors?.map((c, i) => (
        <Stop key={i} offset={locations?.[i]} stopColor={c} stopOpacity="1" />
      ))}
    </RadialGradient>
  )
}
