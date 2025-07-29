export const sortObjectKeys = (obj) => {
  if (typeof obj !== "object" || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((element) => sortObjectKeys(element))
  }

  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key])
      return acc
    }, {})
}

export const cleanJsonText = (text) => {
  const cleaned = text.replaceAll(/,\s*\}/g, "}")
  try {
    JSON.parse(cleaned)
    return cleaned
  } catch {
    return text
  }
}
