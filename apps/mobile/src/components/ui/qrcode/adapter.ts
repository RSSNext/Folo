import type { QRCodeOptions } from "qrcode"
import QRC from "qrcode"

import type { BitArray, BitMatrix } from "./types"

export type { QRCodeErrorCorrectionLevel, QRCodeOptions } from "qrcode"
export type QRCodeMessage = string | QRC.QRCodeSegment[]

export function createQRCode(
  message: QRCodeMessage,
  options: QRCodeOptions,
): { size: number; bitMatrix: BitMatrix } {
  const QRCodeData = QRC.create(message, options)
  const { size = 0, data = [] } = QRCodeData?.modules || {}
  const bitArray = Array.from(data).map((bit) => (bit ? 1 : 0))
  const bitMatrix = transformBitArrayToMatrix(bitArray, size)

  return {
    size,
    bitMatrix,
  }
}

function transformBitArrayToMatrix(bitArray: BitArray, qrCodeSize: number): BitMatrix {
  const matrix: BitArray[] = []
  let row: BitArray = []

  for (const [i, element] of bitArray.entries()) {
    row.push(element || 0)

    if ((i + 1) % qrCodeSize === 0) {
      matrix.push([...row])
      row = []
    }
  }

  return matrix
}
