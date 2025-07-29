import type * as React from "react"
import type { ColorValue } from "react-native"
import type { ImageProps as SVGImageProps, PathProps } from "react-native-svg"

export type GradientOrigin = [number, number]

export type GradientType = "linear" | "radial" // default 'linear'

export type LinearGradientProps = {
  colors?: ColorValue[]
  start?: [number, number] // start point [x, y] (0 -> 0%, 1 -> 100%)
  end?: [number, number] // end point [x, y] (0 -> 0%, 1 -> 100%)
  locations?: number[] // list of colors positions (0 -> 0%, 1 -> 100%)
}

export type RadialGradientProps = {
  colors?: ColorValue[]
  center?: [number, number] // center point [x, y] (0 -> 0%, 1 -> 100%)
  radius?: [number, number] // radiusXY [x, y] (0 -> 0%, 1 -> 100%)
  locations?: number[] // list of colors positions (0 -> 0%, 1 -> 100%)
}

export type GradientProps = {
  type?: GradientType
  options?: LinearGradientProps | RadialGradientProps
}

export type CornerType = "rounded" | "cut" // default 'rounded'

export type BorderRadius = number | number[]

export type Bit = 0 | 1

export type BitArray = Bit[]

export type BitMatrix = BitArray[]

export type PieceOptions = {
  pieceSize?: number
  pieceScale?: PathProps["scale"] // scaleXY | [scaleX, scaleY]
  pieceRotation?: string | number
  pieceCornerType?: CornerType
  pieceBorderRadius?: BorderRadius
  pieceStroke?: ColorValue
  pieceStrokeWidth?: number
  color?: ColorValue
  gradient?: GradientProps
}

export type EyePosition = "topLeft" | "topRight" | "bottomLeft"

export type EyeOptions = {
  scale?: PathProps["scale"] // scaleXY | [scaleX, scaleY]
  rotation?: string | number
  borderRadius?: BorderRadius
  color?: ColorValue
  gradient?: GradientProps
  stroke?: ColorValue
  strokeWidth?: number
}

export type AllEyesOptions = Partial<Record<EyePosition, EyeOptions>>

export type RenderCustomPieceItem = ({
  x,
  y,
  pieceSize,
  qrSize,
  bitMatrix,
}: {
  x: number
  y: number
  pieceSize: number
  qrSize: number
  bitMatrix: BitMatrix
}) => React.ReactElement | null

export type LogoArea = {
  x: number
  y: number
  width: number
  height: number
}

export type LogoOptions = {
  hidePieces?: boolean
  padding?: number
  scale?: number
  onChange?: (logoArea?: LogoArea) => void
} & SVGImageProps
