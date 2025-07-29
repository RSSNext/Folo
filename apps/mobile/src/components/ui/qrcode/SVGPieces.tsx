import * as React from "react"
import { memo } from "react"
import { Path } from "react-native-svg"

import { INNER_EYE_SIZE_IN_BITS, OUTER_EYE_SIZE_IN_BITS } from "./constants"
import {
  getInnerEyePathData,
  getOuterEyePathData,
  getPieceLiquidPathData,
  getPieceRoundedSquarePathData,
  getPieceSquarePathData,
  getRoundedInnerEyePathData,
  getRoundedOuterEyePathData,
  isCoordsOfInnerEyes,
  isCoordsOfOuterEyes,
  isLiquidPieceInEyes,
  transformBorderRadiusToArray,
} from "./helper"
import type {
  AllEyesOptions,
  BitMatrix,
  BorderRadius,
  EyePosition,
  LogoArea,
  PieceOptions,
  RenderCustomPieceItem,
} from "./types"

export const DEFAULT_PIECE_SIZE = 5

interface SVGPiecesProps extends PieceOptions {
  bitMatrix: BitMatrix
  pieceLiquidRadius?: number
  pieceBorderRadius?: BorderRadius
  outerEyesOptions?: AllEyesOptions
  innerEyesOptions?: AllEyesOptions
  isPiecesGlued?: boolean
  renderCustomPieceItem?: RenderCustomPieceItem
  logoArea?: LogoArea
}

function SVGPiecesImpl({
  bitMatrix,
  pieceLiquidRadius = 0,
  pieceBorderRadius,
  pieceSize = DEFAULT_PIECE_SIZE,
  pieceCornerType,
  pieceScale,
  pieceRotation,
  pieceStroke,
  pieceStrokeWidth,
  outerEyesOptions,
  innerEyesOptions,
  isPiecesGlued = false,
  renderCustomPieceItem,
  logoArea,
}: SVGPiecesProps) {
  if (!bitMatrix || !bitMatrix[0]) {
    return null
  }

  const qrSize = bitMatrix.length * pieceSize
  const svgPiecesMatrix: React.ReactElement[] = []

  if (renderCustomPieceItem) {
    for (let y = 0; y < bitMatrix.length; y++) {
      for (let x = 0; x < bitMatrix.length; x++) {
        const PieceElement = renderCustomPieceItem({ x, y, pieceSize, qrSize, bitMatrix })

        if (PieceElement) {
          svgPiecesMatrix.push(PieceElement)
        }
      }
    }

    return <>{svgPiecesMatrix}</>
  }

  const transformedPieceBorderRadius = transformBorderRadiusToArray(pieceBorderRadius)

  for (let y = 0; y < bitMatrix.length; y++) {
    for (let x = 0; x < bitMatrix.length; x++) {
      // Not showing any shapes overlapping with logo if QR has it
      if (logoArea) {
        const _x = x * pieceSize
        const _y = y * pieceSize
        if (
          logoArea.x < _x + pieceSize &&
          logoArea.x + logoArea.width > _x &&
          logoArea.y < _y + pieceSize &&
          logoArea.y + logoArea.height > _y
        ) {
          continue
        }
      }

      if (bitMatrix[y]?.[x] === 1) {
        const origin = `
          ${x * pieceSize + pieceSize / 2},
          ${y * pieceSize + pieceSize / 2}`

        let d = getPieceSquarePathData(x, y, pieceSize)

        if (transformedPieceBorderRadius) {
          d = getPieceRoundedSquarePathData({
            x,
            y,
            size: pieceSize,
            cornerType: pieceCornerType,
            borderRadius: transformedPieceBorderRadius,
            isGlued: isPiecesGlued,
            isLiquid: !!pieceLiquidRadius,
            bitMatrix,
          })
        }

        const PathComponent = (
          <Path
            scale={pieceScale}
            rotation={pieceRotation}
            origin={origin}
            stroke={pieceStroke}
            strokeWidth={pieceStrokeWidth}
            key={`${x}_${y}`}
            d={d}
          />
        )

        // not showing pieces if cornerSquaresOptions | cornerDotsOptions exist
        if (outerEyesOptions || innerEyesOptions) {
          if (
            (outerEyesOptions &&
              !innerEyesOptions &&
              !isCoordsOfOuterEyes(x, y, bitMatrix.length)) ||
            (!outerEyesOptions &&
              innerEyesOptions &&
              !isCoordsOfInnerEyes(x, y, bitMatrix.length)) ||
            (innerEyesOptions &&
              !isCoordsOfInnerEyes(x, y, bitMatrix.length) &&
              outerEyesOptions &&
              !isCoordsOfOuterEyes(x, y, bitMatrix.length))
          ) {
            svgPiecesMatrix.push(PathComponent)
          }
        } else {
          svgPiecesMatrix.push(PathComponent)
        }
      } else {
        // adding liquid between bits in empty places
        if (
          pieceLiquidRadius &&
          ((outerEyesOptions && !isLiquidPieceInEyes(x, y, bitMatrix.length)) || !outerEyesOptions)
        ) {
          const d = getPieceLiquidPathData(x, y, pieceSize, pieceLiquidRadius)
          const origin = `
            ${x * pieceSize + pieceSize / 2},
            ${y * pieceSize + pieceSize / 2}`

          if (bitMatrix[y]?.[x - 1] === 1 && bitMatrix[y - 1]?.[x] === 1) {
            svgPiecesMatrix.push(<Path key={`${x}_${y}_topLeft`} d={d} />)
          }

          if (bitMatrix[y]?.[x - 1] === 1 && bitMatrix[y + 1]?.[x] === 1) {
            svgPiecesMatrix.push(
              <Path rotation={-90} origin={origin} key={`${x}_${y}_topRight`} d={d} />,
            )
          }

          if (bitMatrix[y]?.[x + 1] === 1 && bitMatrix[y - 1]?.[x] === 1) {
            svgPiecesMatrix.push(
              <Path rotation={90} origin={origin} key={`${x}_${y}_bottomRight`} d={d} />,
            )
          }

          if (bitMatrix[y]?.[x + 1] === 1 && bitMatrix[y + 1]?.[x] === 1) {
            svgPiecesMatrix.push(
              <Path rotation={180} origin={origin} key={`${x}_${y}_bottomLeft`} d={d} />,
            )
          }
        }
      }
    }
  }

  // adding custom corner squares if options is exist
  if (outerEyesOptions) {
    const listPositions: EyePosition[] = ["topLeft", "topRight", "bottomLeft"]
    const origins = {
      topLeft: `${(pieceSize * OUTER_EYE_SIZE_IN_BITS) / 2}, ${
        (pieceSize * OUTER_EYE_SIZE_IN_BITS) / 2
      }`,
      topRight: `${qrSize - (pieceSize * OUTER_EYE_SIZE_IN_BITS) / 2}, ${
        (pieceSize * OUTER_EYE_SIZE_IN_BITS) / 2
      }`,
      bottomLeft: `${(pieceSize * OUTER_EYE_SIZE_IN_BITS) / 2}, ${
        qrSize - (pieceSize * OUTER_EYE_SIZE_IN_BITS) / 2
      }`,
    }

    listPositions.forEach((position) => {
      let d = getOuterEyePathData(position, pieceSize, qrSize)

      if (Object.keys(outerEyesOptions).includes(position)) {
        const transformedOuterEyeBorderRadius = transformBorderRadiusToArray(
          outerEyesOptions[position]?.borderRadius,
        )

        if (transformedOuterEyeBorderRadius) {
          d = getRoundedOuterEyePathData(
            position,
            transformedOuterEyeBorderRadius,
            pieceSize,
            bitMatrix.length * pieceSize,
          )
        }
      }

      svgPiecesMatrix.push(
        <Path
          fill={
            outerEyesOptions?.[position]?.gradient
              ? `url(#${position}OuterEyeGradient)`
              : outerEyesOptions?.[position]?.color || undefined
          }
          fillRule="evenodd"
          stroke={outerEyesOptions?.[position]?.stroke}
          strokeWidth={outerEyesOptions?.[position]?.strokeWidth}
          scale={outerEyesOptions?.[position]?.scale}
          rotation={outerEyesOptions?.[position]?.rotation}
          origin={origins[position]}
          key={`${position}OuterEye`}
          d={d}
        />,
      )
    })
  }

  // adding custom corner dots if options is exist
  if (innerEyesOptions) {
    const listPositions: EyePosition[] = ["topLeft", "topRight", "bottomLeft"]
    const origins = {
      topLeft: `${pieceSize * 2 + (pieceSize * INNER_EYE_SIZE_IN_BITS) / 2}, ${
        pieceSize * 2 + (pieceSize * INNER_EYE_SIZE_IN_BITS) / 2
      }`,
      topRight: `${qrSize - pieceSize * 2 - (pieceSize * INNER_EYE_SIZE_IN_BITS) / 2}, ${
        pieceSize * 2 + (pieceSize * INNER_EYE_SIZE_IN_BITS) / 2
      }`,
      bottomLeft: `${pieceSize * 2 + (pieceSize * INNER_EYE_SIZE_IN_BITS) / 2}, ${
        qrSize - pieceSize * 2 - (pieceSize * INNER_EYE_SIZE_IN_BITS) / 2
      }`,
    }

    listPositions.forEach((position) => {
      let d = getInnerEyePathData(position, pieceSize, bitMatrix.length * pieceSize)

      if (Object.keys(innerEyesOptions).includes(position)) {
        const transformedInnerEyeBorderRadius = transformBorderRadiusToArray(
          innerEyesOptions[position]?.borderRadius,
        )

        if (transformedInnerEyeBorderRadius) {
          d = getRoundedInnerEyePathData(
            position,
            transformedInnerEyeBorderRadius,
            pieceSize,
            bitMatrix.length * pieceSize,
          )
        }
      }

      svgPiecesMatrix.push(
        <Path
          fill={
            innerEyesOptions?.[position]?.gradient
              ? `url(#${position}InnerEyeGradient)`
              : innerEyesOptions?.[position]?.color || undefined
          }
          stroke={innerEyesOptions?.[position]?.stroke}
          strokeWidth={innerEyesOptions?.[position]?.strokeWidth}
          scale={innerEyesOptions?.[position]?.scale}
          rotation={innerEyesOptions?.[position]?.rotation}
          origin={origins[position]}
          key={`${position}InnerEye`}
          d={d}
        />,
      )
    })
  }

  return <>{svgPiecesMatrix}</>
}

export default memo(SVGPiecesImpl)
