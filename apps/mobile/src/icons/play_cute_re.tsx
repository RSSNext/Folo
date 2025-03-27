import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface PlayCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const PlayCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: PlayCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M7.44 3.497c-.713.159-1.471.592-1.895 1.084-.757.877-1.023 1.765-1.151 3.839-.065 1.07-.065 6.083.001 7.16.131 2.157.428 3.078 1.265 3.92.749.754 1.618 1.094 2.68 1.047 1.174-.052 2.228-.509 5.64-2.446 1.081-.614 3.061-1.806 3.724-2.243 1.964-1.294 2.704-2.356 2.7-3.878-.001-.483-.037-.723-.165-1.102-.345-1.026-1.093-1.818-2.699-2.859a104.783 104.783 0 0 0-3.76-2.248c-2.796-1.579-3.934-2.112-4.852-2.272-.401-.07-1.178-.071-1.488-.002m1.555 2.085c.91.304 3.062 1.453 5.818 3.105 2.732 1.638 3.393 2.182 3.573 2.947.181.769-.151 1.375-1.165 2.128-.944.699-3.784 2.394-6.181 3.687-2.292 1.237-3.072 1.386-3.887.745-.434-.342-.651-1.042-.753-2.434-.068-.921-.096-4.892-.045-6.36.065-1.9.171-2.639.45-3.163a1.665 1.665 0 0 1 1.025-.796c.261-.066.706-.012 1.165.141"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
