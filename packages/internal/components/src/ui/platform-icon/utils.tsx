import * as validator from "@follow/utils/link-parser"

export const getSupportedPlatformIconName = (url: string) => {
  const safeUrl = parseSafeUrl(url)

  if (!safeUrl) {
    return false
  }

  return (
    Object.values(validator).find((parser) => {
      const res = parser(safeUrl)

      if (res.validate) {
        return true
      }
      return false
    })?.parserName || false
  )
}

export const parseSafeUrl = (url: string) => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}
