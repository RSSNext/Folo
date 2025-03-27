import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface ListCollapseCuteFiIconProps {
  width?: number
  height?: number
  color?: string
}

export const ListCollapseCuteFiIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: ListCollapseCuteFiIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M3.493 3.594c-.413.143-.798.545-.918.958-.086.297-.06.799.056 1.058.117.263.455.607.725.74l.224.11h8.322l.267-.131c1.093-.538 1.093-2.119 0-2.658l-.267-.131-4.101-.009c-3.852-.008-4.114-.005-4.308.063m14.182.459c-.49.183-.782.534-1.575 1.887-.475.811-.877 1.587-.977 1.889-.12.358-.113.756.016 1.002.055.104.122.217.15.251.115.139.363.29.594.362.68.212 3.558.209 4.248-.004.541-.167.841-.55.841-1.074 0-.408-.143-.784-.642-1.686-.922-1.669-1.397-2.331-1.829-2.55-.24-.121-.614-.157-.826-.077M3.493 10.594c-.413.143-.798.545-.918.958-.086.297-.06.799.056 1.058.117.263.455.607.725.74l.224.11h8.322l.267-.131c1.093-.538 1.093-2.119 0-2.658l-.267-.131-4.101-.009c-3.852-.008-4.114-.005-4.308.063m14.182 3.459c-.49.183-.782.534-1.575 1.887-.475.811-.877 1.587-.977 1.889-.12.358-.113.756.016 1.002.055.104.122.217.15.251.115.139.363.29.594.362.68.212 3.558.209 4.248-.004.541-.167.841-.55.841-1.074 0-.408-.143-.784-.642-1.686-.922-1.669-1.397-2.331-1.829-2.55-.24-.121-.614-.157-.826-.077M3.493 17.594c-.413.143-.798.545-.918.958-.086.297-.06.799.056 1.058.117.263.455.607.725.74l.224.11h8.322l.267-.131c1.093-.538 1.093-2.119 0-2.658l-.267-.131-4.101-.009c-3.852-.008-4.114-.005-4.308.063"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
