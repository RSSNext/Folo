import { INNER_EYE_SIZE_IN_BITS, OUTER_EYE_SIZE_IN_BITS } from "./constants"
import type { BitMatrix, BorderRadius, CornerType, EyePosition } from "./types"

export function transformBorderRadiusToArray(borderRadius?: BorderRadius): number[] | undefined {
  if (!borderRadius) {
    return undefined
  }

  if (Array.isArray(borderRadius)) {
    return borderRadius.length === 0 ? undefined : borderRadius
  }

  return Array.from({ length: 4 }, () => borderRadius)
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

// x, y - indexes in matrix
export function getPieceRoundedSquarePathData({
  x,
  y,
  size,
  cornerType,
  borderRadius,
  isGlued,
  isLiquid,
  bitMatrix,
}: {
  x: number
  y: number
  size: number
  cornerType?: CornerType
  borderRadius?: number[]
  isGlued?: boolean
  isLiquid?: boolean
  bitMatrix: BitMatrix
}): string {
  const _x = x * size
  const _y = y * size
  const isCornerTypeCut = cornerType === "cut"
  let [topLeftR = 0, topRightR = 0, bottomRightR = 0, bottomLeftR = 0] = borderRadius || []

  const generateArcStart = (cornerPosition: number) =>
    isCornerTypeCut ? "L" : `A${cornerPosition} ${cornerPosition} 0 0 1`

  // check for surrounding pieces & remove related corner border radius
  if (isGlued) {
    if (bitMatrix[y]?.[x - 1] === 1) {
      topLeftR = 0
      bottomLeftR = 0
    }
    if (bitMatrix[y - 1]?.[x] === 1) {
      topLeftR = 0
      topRightR = 0
    }
    if (bitMatrix[y]?.[x + 1] === 1) {
      topRightR = 0
      bottomRightR = 0
    }
    if (bitMatrix[y + 1]?.[x] === 1) {
      bottomLeftR = 0
      bottomRightR = 0
    }
  }

  if (isLiquid) {
    if (bitMatrix[y - 1]?.[x - 1] === 1) {
      topLeftR = 0
    }
    if (bitMatrix[y - 1]?.[x + 1] === 1) {
      topRightR = 0
    }
    if (bitMatrix[y + 1]?.[x + 1] === 1) {
      bottomRightR = 0
    }
    if (bitMatrix[y + 1]?.[x - 1] === 1) {
      bottomLeftR = 0
    }
  }

  // render svg if we have list of different border radius
  return `
    M${_x} ${_y + topLeftR}
    ${generateArcStart(topLeftR)} ${_x + topLeftR} ${_y}
    L${_x + size - topRightR} ${_y}
    ${generateArcStart(topRightR)} ${_x + size} ${_y + topRightR}
    L${_x + size} ${_y + size - bottomRightR}
    ${generateArcStart(bottomRightR)}  ${_x + size - bottomRightR} ${_y + size}
    L${_x + bottomLeftR} ${_y + size}
    ${generateArcStart(bottomLeftR)}  ${_x} ${_y + size - bottomLeftR}
    z
  `
}

export function getPieceLiquidPathData(
  x: number,
  y: number,
  size: number,
  borderRadius: number,
): string {
  const _x = x * size
  const _y = y * size
  const r = Math.min(borderRadius, size)

  return `
      M${_x} ${_y}
      L${_x + r} ${_y}
      A${r} ${r} 0 0 0 ${_x} ${_y + r} z`
}

export function getOuterEyePathData(
  position: EyePosition,
  pieceSize: number,
  qrSize: number,
): string {
  const outerEyeSize = OUTER_EYE_SIZE_IN_BITS * pieceSize

  if (position === "topLeft") {
    return `
      M0 0
      ${outerEyeSize} 0
      ${outerEyeSize} ${outerEyeSize}
      0 ${outerEyeSize} z
      M${pieceSize} ${pieceSize}
      ${outerEyeSize - pieceSize} ${pieceSize}
      ${outerEyeSize - pieceSize} ${outerEyeSize - pieceSize}
      ${pieceSize} ${outerEyeSize - pieceSize} z
    `
  }

  if (position === "topRight") {
    return `
      M${qrSize - outerEyeSize} 0
      ${qrSize} 0
      ${qrSize} ${outerEyeSize}
      ${qrSize - outerEyeSize} ${outerEyeSize} z
      M${qrSize - outerEyeSize + pieceSize} ${pieceSize}
      ${qrSize - pieceSize} ${pieceSize}
      ${qrSize - pieceSize} ${outerEyeSize - pieceSize}
      ${qrSize - outerEyeSize + pieceSize} ${outerEyeSize - pieceSize} z
    `
  }

  if (position === "bottomLeft") {
    return `
      M0 ${qrSize - outerEyeSize}
      ${outerEyeSize} ${qrSize - outerEyeSize}
      ${outerEyeSize} ${qrSize}
      0 ${qrSize} z
      M${pieceSize} ${qrSize - outerEyeSize + pieceSize}
      ${outerEyeSize - pieceSize} ${qrSize - outerEyeSize + pieceSize}
      ${outerEyeSize - pieceSize} ${qrSize - pieceSize}
      ${pieceSize} ${qrSize - pieceSize} z
    `
  }

  return ""
}

export function getRoundedOuterEyePathData(
  position: EyePosition,
  borderRadius: number[],
  pieceSize: number,
  qrSize: number,
): string {
  const outerEyeSize = OUTER_EYE_SIZE_IN_BITS * pieceSize
  const [topLeftR = 0, topRightR = 0, bottomRightR = 0, bottomLeftR = 0] = borderRadius || []
  const topLeftInnerR = pieceSize < topLeftR ? topLeftR - pieceSize : 0
  const topRightInnerR = pieceSize < topRightR ? topRightR - pieceSize : 0
  const bottomRightInnerR = pieceSize < bottomRightR ? bottomRightR - pieceSize : 0
  const bottomLeftInnerR = pieceSize < bottomLeftR ? bottomLeftR - pieceSize : 0

  if (position === "topLeft") {
    return `
      M0 ${topLeftR}
      A${topLeftR} ${topLeftR} 0 0 1 ${topLeftR} 0
      L${outerEyeSize - topRightR} 0
      A${topRightR} ${topRightR} 0 0 1 ${outerEyeSize} ${topRightR}
      L${outerEyeSize} ${outerEyeSize - bottomRightR}
      A${bottomRightR} ${bottomRightR} 0 0 1 ${outerEyeSize - bottomRightR} ${outerEyeSize}
      L${bottomLeftR} ${outerEyeSize}
      ${bottomLeftR ? `A${bottomLeftR} ${bottomLeftR} 0 0 1 0 ${outerEyeSize - bottomLeftR}` : ""}
      z
      M${pieceSize} ${pieceSize + topLeftInnerR}
      A${topLeftInnerR} ${topLeftInnerR} 0 0 1 ${pieceSize + topLeftInnerR} ${pieceSize}
      L${outerEyeSize - pieceSize - topRightInnerR} ${pieceSize}
      A${topRightInnerR} ${topRightInnerR} 0 0 1 ${outerEyeSize - pieceSize} ${
        pieceSize + topRightInnerR
      }
      L${outerEyeSize - pieceSize} ${outerEyeSize - pieceSize - bottomRightInnerR}
      A${bottomRightInnerR} ${bottomRightInnerR} 0 0 1 ${
        outerEyeSize - pieceSize - bottomRightInnerR
      } ${outerEyeSize - pieceSize}
      L${pieceSize + bottomLeftInnerR} ${outerEyeSize - pieceSize}
      A${bottomLeftInnerR} ${bottomLeftInnerR} 0 0 1 ${pieceSize} ${
        outerEyeSize - pieceSize - bottomLeftInnerR
      }
      z
    `
  }

  if (position === "topRight") {
    return `
      M${qrSize - outerEyeSize} ${topLeftR}
      ${topLeftR ? `A${topLeftR} ${topLeftR} 0 0 1 ${qrSize - outerEyeSize + topLeftR} 0` : ""}
      L${qrSize - topRightR} 0
      ${topRightR ? `A${topRightR} ${topRightR} 0 0 1 ${qrSize} ${topRightR}` : ""}
      L${qrSize} ${outerEyeSize - bottomRightR}
      A${bottomRightR} ${bottomRightR} 0 0 1 ${qrSize - bottomRightR} ${outerEyeSize}
      L${qrSize - outerEyeSize + bottomLeftR} ${outerEyeSize}
      A${bottomLeftR} ${bottomLeftR} 0 0 1 ${qrSize - outerEyeSize} ${outerEyeSize - bottomLeftR}
      z
      M${qrSize - outerEyeSize + pieceSize} ${pieceSize + topLeftInnerR}
      A${topLeftInnerR} ${topLeftInnerR} 0 0 1 ${
        qrSize - outerEyeSize + pieceSize + topLeftInnerR
      } ${pieceSize}
      L${qrSize - pieceSize - topRightInnerR} ${pieceSize}
      A${topRightInnerR} ${topRightInnerR} 0 0 1 ${qrSize - pieceSize} ${pieceSize + topRightInnerR}
      L${qrSize - pieceSize} ${outerEyeSize - pieceSize - bottomRightInnerR}
      A${bottomRightInnerR} ${bottomRightInnerR} 0 0 1 ${qrSize - pieceSize - bottomRightInnerR} ${
        outerEyeSize - pieceSize
      }
      L${qrSize - outerEyeSize + pieceSize + bottomLeftInnerR} ${outerEyeSize - pieceSize}
      A${bottomLeftInnerR} ${bottomLeftInnerR} 0 0 1 ${qrSize - outerEyeSize + pieceSize} ${
        outerEyeSize - pieceSize - bottomLeftInnerR
      }
      z
    `
  }

  if (position === "bottomLeft") {
    return `
      M0 ${qrSize - outerEyeSize + topLeftR}
      A${topLeftR} ${topLeftR} 0 0 1 ${topLeftR} ${qrSize - outerEyeSize}
      L${outerEyeSize - topRightR} ${qrSize - outerEyeSize}
      A${topRightR} ${topRightR} 0 0 1 ${outerEyeSize} ${qrSize - outerEyeSize + topRightR}
      L${outerEyeSize} ${qrSize - bottomRightR}
      A${bottomRightR} ${bottomRightR} 0 0 1 ${outerEyeSize - bottomRightR} ${qrSize}
      L${bottomLeftR} ${qrSize}
      A${bottomLeftR} ${bottomLeftR} 0 0 1 0 ${qrSize - bottomLeftR}
      z
      M${pieceSize} ${qrSize - outerEyeSize + pieceSize + topLeftInnerR}
      A${topLeftInnerR} ${topLeftInnerR} 0 0 1 ${pieceSize + topLeftInnerR} ${
        qrSize - outerEyeSize + pieceSize
      }
      L${outerEyeSize - pieceSize - topRightInnerR} ${qrSize - outerEyeSize + pieceSize}
      A${topRightInnerR} ${topRightInnerR} 0 0 1 ${outerEyeSize - pieceSize} ${
        qrSize - outerEyeSize + pieceSize + topRightInnerR
      }
      L${outerEyeSize - pieceSize} ${qrSize - pieceSize - bottomRightInnerR}
      A${bottomRightInnerR} ${bottomRightInnerR} 0 0 1 ${
        outerEyeSize - pieceSize - bottomRightInnerR
      } ${qrSize - pieceSize}
      L${pieceSize + bottomLeftInnerR} ${qrSize - pieceSize}
      A${bottomLeftInnerR} ${bottomLeftInnerR} 0 0 1 ${pieceSize} ${
        qrSize - pieceSize - bottomLeftInnerR
      }
      z
    `
  }

  return ""
}

export function getInnerEyePathData(
  position: EyePosition,
  pieceSize: number,
  qrSize: number,
): string {
  const outerSize = OUTER_EYE_SIZE_IN_BITS * pieceSize
  const innerSize = INNER_EYE_SIZE_IN_BITS * pieceSize
  const offset = 2 * pieceSize

  if (position === "topLeft") {
    return `
      M${offset} ${offset}
      ${offset + innerSize} ${offset}
      ${offset + innerSize} ${offset + innerSize}
      ${offset} ${offset + innerSize} z
    `
  }

  if (position === "topRight") {
    return `
      M${qrSize - outerSize + offset} ${offset}
      ${qrSize - offset} ${offset}
      ${qrSize - offset} ${offset + innerSize}
      ${qrSize - outerSize + offset} ${offset + innerSize} z
    `
  }

  if (position === "bottomLeft") {
    return `
      M${offset} ${qrSize - outerSize + offset}
      ${offset + innerSize} ${qrSize - outerSize + offset}
      ${offset + innerSize} ${qrSize - offset}
      ${offset} ${qrSize - offset} z
    `
  }

  return ""
}

export function getRoundedInnerEyePathData(
  position: EyePosition,
  borderRadius: number[],
  pieceSize: number,
  qrSize: number,
): string {
  const outerSize = OUTER_EYE_SIZE_IN_BITS * pieceSize
  const innerSize = INNER_EYE_SIZE_IN_BITS * pieceSize
  const offset = 2 * pieceSize
  const [topLeftR = 0, topRightR = 0, bottomRightR = 0, bottomLeftR = 0] = borderRadius || []

  if (position === "topLeft") {
    return `
      M${offset} ${offset + topLeftR}
      A${topLeftR} ${topLeftR} 0 0 1 ${offset + topLeftR} ${offset}
      L${offset + innerSize - topRightR} ${offset}
      A${topRightR} ${topRightR} 0 0 1 ${offset + innerSize} ${offset + topRightR}
      L${offset + innerSize} ${offset + innerSize - bottomRightR}
      A${bottomRightR} ${bottomRightR} 0 0 1 ${offset + innerSize - bottomRightR} ${
        offset + innerSize
      }
      L${offset + bottomLeftR} ${offset + innerSize} 
      A${bottomLeftR} ${bottomLeftR} 0 0 1 ${offset} ${offset + innerSize - bottomLeftR} z
    `
  }

  if (position === "topRight") {
    return `
      M${qrSize - outerSize + offset} ${offset + topLeftR}
      A${topLeftR} ${topLeftR} 0 0 1 ${qrSize - outerSize + offset + topLeftR} ${offset}
      L${qrSize - offset - topRightR} ${offset}
      A${topRightR} ${topRightR} 0 0 1 ${qrSize - offset} ${offset + topRightR}
      L${qrSize - offset} ${offset + innerSize - bottomRightR}
      A${bottomRightR} ${bottomRightR} 0 0 1 ${qrSize - offset - bottomRightR} ${offset + innerSize}
      L${qrSize - outerSize + offset + bottomLeftR} ${offset + innerSize} 
      A${bottomLeftR} ${bottomLeftR} 0 0 1 ${qrSize - outerSize + offset} ${
        offset + innerSize - bottomLeftR
      } z
    `
  }

  if (position === "bottomLeft") {
    return `
      M${offset} ${qrSize - outerSize + offset + topLeftR}
      A${topLeftR} ${topLeftR} 0 0 1 ${offset + topLeftR} ${qrSize - outerSize + offset}
      L${offset + innerSize - topRightR} ${qrSize - outerSize + offset}
      A${topRightR} ${topRightR} 0 0 1 ${offset + innerSize} ${
        qrSize - outerSize + offset + topRightR
      }
      L${offset + innerSize} ${qrSize - offset - bottomRightR}
      A${bottomRightR} ${bottomRightR} 0 0 1 ${offset + innerSize - bottomRightR} ${qrSize - offset}
      L${offset + bottomLeftR} ${qrSize - offset} 
      A${bottomLeftR} ${bottomLeftR} 0 0 1 ${offset} ${qrSize - offset - bottomLeftR} z
    `
  }

  return ""
}

export function isLiquidPieceInEyes(x: number, y: number, qrSize: number): boolean {
  return (
    // top left square
    (x >= 1 && x < 6 && y >= 1 && y < 6) ||
    // top right square
    (x >= qrSize - 6 && x < qrSize && y >= 1 && y < 6) ||
    // bottom left square
    (x >= 1 && x < 6 && y >= qrSize - 6 && y < qrSize)
  )
}

export function isCoordsOfTopLeftOuterEye(x: number, y: number): boolean {
  return (
    (x >= 0 && x < OUTER_EYE_SIZE_IN_BITS && y === 0) ||
    (x >= 0 && x < OUTER_EYE_SIZE_IN_BITS && y === OUTER_EYE_SIZE_IN_BITS - 1) ||
    (y > 0 && y < OUTER_EYE_SIZE_IN_BITS - 1 && x === 0) ||
    (y > 0 && y < OUTER_EYE_SIZE_IN_BITS - 1 && x === OUTER_EYE_SIZE_IN_BITS - 1)
  )
}

export function isCoordsOfTopRightOuterEye(x: number, y: number, qrSize: number): boolean {
  return (
    (x >= qrSize - OUTER_EYE_SIZE_IN_BITS && x < qrSize && y === 0) ||
    (x >= qrSize - OUTER_EYE_SIZE_IN_BITS && x < qrSize && y === OUTER_EYE_SIZE_IN_BITS - 1) ||
    (y > 0 && y < OUTER_EYE_SIZE_IN_BITS - 1 && x === qrSize - OUTER_EYE_SIZE_IN_BITS) ||
    (y > 0 && y < OUTER_EYE_SIZE_IN_BITS - 1 && x === qrSize - 1)
  )
}

export function isCoordsOfBottomLeftOuterEye(x: number, y: number, qrSize: number): boolean {
  return (
    (x >= 0 && x < OUTER_EYE_SIZE_IN_BITS && y === qrSize - OUTER_EYE_SIZE_IN_BITS) ||
    (x >= 0 && x < OUTER_EYE_SIZE_IN_BITS && y === qrSize - 1) ||
    (y > qrSize - OUTER_EYE_SIZE_IN_BITS && y < qrSize && x === 0) ||
    (y > qrSize - OUTER_EYE_SIZE_IN_BITS && y < qrSize && x === OUTER_EYE_SIZE_IN_BITS - 1)
  )
}

// x, y is amount of matrix bits
export function isCoordsOfOuterEyes(x: number, y: number, qrSize: number): boolean {
  return (
    // top left square
    isCoordsOfTopLeftOuterEye(x, y) ||
    // top right square
    isCoordsOfTopRightOuterEye(x, y, qrSize) ||
    // bottom left square
    isCoordsOfBottomLeftOuterEye(x, y, qrSize)
  )
}

export function isCoordsOfTopLeftInnerEye(x: number, y: number): boolean {
  return x >= 2 && x < INNER_EYE_SIZE_IN_BITS + 2 && y >= 2 && y < INNER_EYE_SIZE_IN_BITS + 2
}

export function isCoordsOfTopRightInnerEye(x: number, y: number, qrSize: number): boolean {
  return (
    x >= qrSize - OUTER_EYE_SIZE_IN_BITS + 2 &&
    x < qrSize - 2 &&
    y >= 2 &&
    y < INNER_EYE_SIZE_IN_BITS + 2
  )
}

export function isCoordsOfBottomLeftInnerEye(x: number, y: number, qrSize: number): boolean {
  return (
    x >= 2 &&
    x < INNER_EYE_SIZE_IN_BITS + 2 &&
    y >= qrSize - OUTER_EYE_SIZE_IN_BITS + 2 &&
    y < qrSize - 2
  )
}

// x, y is amount of matrix bits
export function isCoordsOfInnerEyes(x: number, y: number, qrSize: number): boolean {
  return (
    // top left square
    isCoordsOfTopLeftInnerEye(x, y) ||
    // top right square
    isCoordsOfTopRightInnerEye(x, y, qrSize) ||
    // bottom left square
    isCoordsOfBottomLeftInnerEye(x, y, qrSize)
  )
}

export function consoleWarn(message: string | unknown) {
  console.warn(`QRCode warning: ${message}`)
}

export function consoleError(message: string | unknown) {
  console.error(`QRCode error: ${message}`)
}
