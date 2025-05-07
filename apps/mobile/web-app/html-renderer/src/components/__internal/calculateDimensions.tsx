export const calculateDimensions = ({
  width,
  height,
  max,
}: {
  width: number | undefined
  height: number | undefined
  max: { width: number; height: number }
}) => {
  if (!width || !height) return { width: undefined, height: undefined }

  const { width: maxW, height: maxH } = max

  const wRatio = maxW / width || 1
  const hRatio = maxH / height || 1

  const ratio = Math.min(wRatio, hRatio, 1)

  return {
    width: width * ratio,
    height: height * ratio,
  }
}
