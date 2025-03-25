import * as React from "react"
import Svg, { Path } from "react-native-svg"

interface PdfCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const PdfCuteReIcon = ({
  width = 24,
  height = 24,
  color = "#10161F",
}: PdfCuteReIconProps) => {
  return (
    <Svg width={width} height={height} fill="none" viewBox="0 0 24 24">
      <Path
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.5 2.5a3 3 0 0 1 3 3v.6c0 .372 0 .557.025.713a2 2 0 0 0 1.662 1.662c.156.025.341.025.713.025h.6a3 3 0 0 1 3 3M12 12l-.074.468a6 6 0 0 1-2.156 3.734l-.368.298.442-.17a6 6 0 0 1 4.31 0l.444.17-.37-.298a6 6 0 0 1-2.155-3.733zm-1.036-9.5h-.296c-2.022 0-3.032 0-3.82.357a4 4 0 0 0-1.991 1.991C4.5 5.636 4.5 6.646 4.5 8.668V14c0 3.288 0 4.931.908 6.038a4 4 0 0 0 .554.554c1.107.908 2.75.908 6.038.908 3.287 0 4.931 0 6.038-.908.202-.166.388-.352.554-.554.908-1.107.908-2.75.908-6.038v-2.964c0-1.033 0-1.55-.082-2.042a6 6 0 0 0-1.033-2.492C18.095 6.095 17.73 5.73 17 5s-1.095-1.095-1.502-1.385a6 6 0 0 0-2.492-1.033c-.492-.082-1.009-.082-2.042-.082Z"
      />
    </Svg>
  )
}
