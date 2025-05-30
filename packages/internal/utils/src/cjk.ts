export const isCJKChar = (char: string): boolean => {
  // eslint-disable-next-line unicorn/prefer-code-point
  const code = char.charCodeAt(0)
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ideographs Extension A
    (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) // Katakana
  )
}

export const getNameInitials = (name?: string): string => {
  if (!name) return ""
  const first = name[0]!
  const second = name[1]

  if (isCJKChar(first)) return first
  if (second && isCJKChar(second)) return first
  return name.slice(0, 2)
}
