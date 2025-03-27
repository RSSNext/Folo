import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface Magic2CuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const Magic2CuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: Magic2CuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        d="M10.673 3.063c-.25.077-.525.353-.612.614-.056.168-.064.373-.053 1.43.011 1.175.016 1.241.098 1.393.182.336.516.538.897.539.42.002.845-.315.955-.71.024-.087.042-.628.042-1.292 0-1.343-.018-1.449-.303-1.734-.279-.279-.63-.361-1.024-.24m-4.844 2.02a.995.995 0 0 0-.693.577c-.091.212-.087.6.006.803.044.094.393.482.875.969.945.956 1.05 1.026 1.512 1.002.243-.012.321-.035.47-.135.099-.067.233-.201.3-.3.1-.149.123-.227.135-.47.024-.462-.046-.567-1.002-1.512-.447-.441-.875-.831-.952-.865a1.147 1.147 0 0 0-.651-.069m9.901-.002c-.259.053-.445.206-1.274 1.045-.865.877-.918.96-.889 1.408.032.509.39.867.899.899.451.029.528-.021 1.439-.922.92-.911 1.025-1.059 1.025-1.449a.979.979 0 0 0-1.2-.981M3.673 10.062a.954.954 0 0 0-.366.237.96.96 0 0 0-.001 1.401c.281.281.391.3 1.731.3.664 0 1.205-.018 1.292-.042.395-.11.712-.535.71-.955a1.01 1.01 0 0 0-.539-.897c-.153-.082-.214-.086-1.4-.094-.996-.007-1.277.003-1.427.05m12.007-.025c-.865.263-.977 1.426-.18 1.857.152.082.219.087 1.372.098 1.43.015 1.532-.002 1.824-.295.184-.183.304-.459.304-.697 0-.237-.12-.514-.303-.697-.287-.286-.388-.304-1.754-.3-.64.002-1.208.018-1.263.034m-3.959 1.008c-.264.08-.456.248-.61.535-.121.225-.118.615.006.86.126.251 8.434 8.557 8.661 8.66.225.102.634.097.842-.011.189-.097.383-.294.481-.488.095-.189.095-.612-.001-.823-.089-.195-8.351-8.49-8.61-8.644a1.109 1.109 0 0 0-.769-.089M7.25 13.562a1.118 1.118 0 0 0-.34.152c-.273.19-1.687 1.647-1.768 1.823-.093.203-.097.591-.006.803.091.215.286.413.501.51.229.103.611.107.826.008.221-.102 1.737-1.607 1.875-1.862a1.06 1.06 0 0 0 .033-.88c-.182-.411-.656-.645-1.121-.554m3.35 1.481a1.013 1.013 0 0 0-.494.457c-.082.152-.087.218-.098 1.393-.014 1.43-.001 1.507.298 1.806.18.181.458.301.694.301.238 0 .514-.12.697-.304.293-.292.31-.394.295-1.824-.011-1.153-.016-1.22-.098-1.372a1.007 1.007 0 0 0-.894-.538c-.136 0-.289.031-.4.081"
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  )
}
