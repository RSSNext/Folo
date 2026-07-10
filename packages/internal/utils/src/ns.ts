const ns = "follow"
export const getStorageNS = (key: string) => `${ns}:${key}`

export const clearStorage = () => {
  const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
  keys.forEach((key) => {
    if (key?.startsWith(ns)) {
      localStorage.removeItem(key)
    }
  })
}
