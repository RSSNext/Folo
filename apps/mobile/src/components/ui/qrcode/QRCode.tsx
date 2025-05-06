import type { Ref } from "react"
import { useEffect, useMemo } from "react"
import type { SvgProps } from "react-native-svg"
import { Defs, G, Svg } from "react-native-svg"

import type { QRCodeMessage, QRCodeOptions } from "./adapter"
import { EYES_POSITIONS, INNER_EYE_SIZE_IN_BITS, OUTER_EYE_SIZE_IN_BITS } from "./constants"
import SVGPieces, { DEFAULT_PIECE_SIZE } from "./SVGPieces"
import { SVGRadialGradient } from "./SVGRadialGradient"
import type {
  AllEyesOptions,
  BitMatrix,
  EyeOptions,
  EyePosition,
  GradientOrigin,
  PieceOptions,
  RenderCustomPieceItem,
} from "./types"
import useQRCodeData from "./useQRCodeData"

function transformEyeOptionsToCommonPattern(
  options?: EyeOptions | AllEyesOptions,
): AllEyesOptions | undefined {
  if (!options) {
    return undefined
  }

  if (Object.keys(options).find((key) => EYES_POSITIONS.includes(key))) {
    return options as AllEyesOptions
  }

  return Object.fromEntries(EYES_POSITIONS.map((position) => [position, options]))
}

// x, y - indexes in matrix
export function getPieceSquarePathData(x: number, y: number, size: number): string {
  const _x = x * size
  const _y = y * size

  return `
    M${_x} ${_y}
    ${_x + size} ${_y}
    ${_x + size} ${_y + size}
    ${_x} ${_y + size}
    z
  `
}

export interface SVGQRCodeStyledProps
  extends QRCodeOptions,
    PieceOptions,
    Omit<SvgProps, "children"> {
  data?: QRCodeMessage
  onChangeSize?: (size: number) => void
  pieceLiquidRadius?: number
  outerEyesOptions?: EyeOptions | AllEyesOptions
  innerEyesOptions?: EyeOptions | AllEyesOptions
  renderCustomPieceItem?: RenderCustomPieceItem
  isPiecesGlued?: boolean
  padding?: number
  ref?: Ref<Svg | null>
  children?: (pieceSize: number, bitMatrix: BitMatrix) => SvgProps["children"]
}

export function QRCode(
  {
    data = "",
    onChangeSize,
    pieceSize = DEFAULT_PIECE_SIZE,
    pieceScale,
    pieceRotation,
    pieceCornerType = "rounded",
    pieceBorderRadius = 0,
    pieceStroke,
    pieceStrokeWidth,
    pieceLiquidRadius,
    isPiecesGlued = false,
    outerEyesOptions,
    innerEyesOptions,
    renderCustomPieceItem,
    padding,
    color = "black",
    gradient,

    version,
    maskPattern,
    toSJISFunc,
    errorCorrectionLevel = "M",
    children,

    ref,
    ...props
  }: SVGQRCodeStyledProps,
  // ref?: ForwardedRef<Svg> | null,
) {
  const qrCodeOptions = useMemo(
    () => ({
      version,
      errorCorrectionLevel,
      maskPattern,
      toSJISFunc,
    }),
    [errorCorrectionLevel, maskPattern, toSJISFunc, version],
  )
  const { qrCodeSize, bitMatrix } = useQRCodeData(data, qrCodeOptions)
  const svgSize = pieceSize * qrCodeSize

  useEffect(() => {
    onChangeSize?.(qrCodeSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeSize])

  const transformedOuterEyesOptions = transformEyeOptionsToCommonPattern(outerEyesOptions)
  const transformedInnerEyesOptions = transformEyeOptionsToCommonPattern(innerEyesOptions)

  const _props = { ...props }
  if (padding) {
    const _size = svgSize + 2 * padding
    _props.width = _size
    _props.height = _size
    _props.viewBox = `-${padding} -${padding} ${_size} ${_size}`
  }

  const startGradientOuterEyeCoords: Record<EyePosition, GradientOrigin> = {
    topLeft: [0, 0],
    topRight: [svgSize - pieceSize * OUTER_EYE_SIZE_IN_BITS, 0],
    bottomLeft: [0, svgSize - pieceSize * OUTER_EYE_SIZE_IN_BITS],
  }

  const startGradientInnerEyeCoords: Record<EyePosition, GradientOrigin> = {
    topLeft: [2 * pieceSize, 2 * pieceSize],
    topRight: [svgSize - pieceSize * INNER_EYE_SIZE_IN_BITS + 2 * pieceSize, 2 * pieceSize],
    bottomLeft: [2 * pieceSize, svgSize - pieceSize * OUTER_EYE_SIZE_IN_BITS + 2 * pieceSize],
  }

  const renderPieces = () => (
    <SVGPieces
      bitMatrix={bitMatrix}
      isPiecesGlued={isPiecesGlued}
      pieceLiquidRadius={pieceLiquidRadius}
      pieceBorderRadius={pieceBorderRadius}
      pieceCornerType={pieceCornerType}
      pieceRotation={pieceRotation}
      pieceScale={pieceScale}
      pieceSize={pieceSize}
      pieceStroke={pieceStroke}
      pieceStrokeWidth={pieceStrokeWidth}
      outerEyesOptions={transformedOuterEyesOptions}
      innerEyesOptions={transformedInnerEyesOptions}
      renderCustomPieceItem={renderCustomPieceItem}
    />
  )

  return (
    <Svg ref={ref} width={svgSize} height={svgSize} {..._props}>
      {(!!gradient || !!transformedOuterEyesOptions || !!transformedInnerEyesOptions) && (
        <Defs>
          {!!gradient && <SVGRadialGradient id="gradient" size={svgSize} {...gradient} />}

          {!!transformedOuterEyesOptions &&
            Object.keys(transformedOuterEyesOptions).map((key) => {
              return (
                <SVGRadialGradient
                  id={`${key}CornerSquareGradient`}
                  key={`${key}CornerSquareGradient`}
                  size={pieceSize * OUTER_EYE_SIZE_IN_BITS}
                  origin={startGradientOuterEyeCoords[key as EyePosition]}
                  {...transformedOuterEyesOptions?.[key as EyePosition]?.gradient}
                />
              )
            })}

          {!!transformedInnerEyesOptions &&
            Object.keys(transformedInnerEyesOptions).map((key) => {
              return (
                <SVGRadialGradient
                  id={`${key}CornerDotGradient`}
                  key={`${key}CornerDotGradient`}
                  size={pieceSize * INNER_EYE_SIZE_IN_BITS}
                  origin={startGradientInnerEyeCoords[key as EyePosition]}
                  {...transformedInnerEyesOptions?.[key as EyePosition]?.gradient}
                />
              )
            })}
        </Defs>
      )}

      <G fill={gradient ? "url(#gradient)" : color}>{renderPieces()}</G>

      {children?.(pieceSize, bitMatrix)}
    </Svg>
  )
}
