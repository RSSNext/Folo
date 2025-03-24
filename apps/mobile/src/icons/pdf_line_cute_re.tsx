import * as React from "react"
import Svg from "react-native-svg"

interface PdfLineCuteReIconProps {
  width?: number
  height?: number
  color?: string
}

export const PdfLineCuteReIcon = ({ width = 24, height = 24 }: PdfLineCuteReIconProps) => {
  return <Svg width={width} height={height} fill="none" viewBox="0 0 24 24" />
}
