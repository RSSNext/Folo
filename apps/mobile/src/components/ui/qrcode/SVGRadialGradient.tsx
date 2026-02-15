import * as React from "react"
import { RadialGradient, Stop } from "react-native-svg"

import type { GradientOrigin, RadialGradientProps } from "./types"

const DEFAULT_ORIGIN: GradientOrigin = [0, 0]
const DEFAULT_CENTER: GradientOrigin = [0.5, 0.5]
const DEFAULT_RADIUS: GradientOrigin = [1, 1]
const DEFAULT_COLORS: string[] = ["black", "white"]
const DEFAULT_LOCATIONS: number[] = [0, 1]

interface SVGRadialGradientProps extends RadialGradientProps {
  id: string
  size: number
  origin?: GradientOrigin
}

export function SVGRadialGradient({
  id,
  size,
  origin = DEFAULT_ORIGIN,
  center = DEFAULT_CENTER,
  radius = DEFAULT_RADIUS,
  colors = DEFAULT_COLORS,
  locations = DEFAULT_LOCATIONS,
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
      {colors?.map((color, colorIndex) => {
        const offset = locations?.[colorIndex]
        return (
          <Stop
            key={`${String(color)}-${String(offset)}`}
            offset={offset}
            stopColor={color}
            stopOpacity="1"
          />
        )
      })}
    </RadialGradient>
  )
}
