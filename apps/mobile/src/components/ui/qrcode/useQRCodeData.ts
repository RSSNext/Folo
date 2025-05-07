import { useMemo } from "react"

import type { QRCodeMessage, QRCodeOptions } from "./adapter"
import { createQRCode } from "./adapter"
import type { BitMatrix } from "./types"

export default function useQRCodeData(
  data: QRCodeMessage,
  options: QRCodeOptions,
): { bitMatrix: BitMatrix; qrCodeSize: number } {
  const QRCodeData = useMemo(() => {
    try {
      return createQRCode(data, options)
    } catch {
      return
    }
  }, [data, options])

  const { size: qrCodeSize = 0, bitMatrix = [] } = QRCodeData || {}

  return {
    bitMatrix,
    qrCodeSize,
  }
}
