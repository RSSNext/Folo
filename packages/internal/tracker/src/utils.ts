import { TrackerMapper } from "./enums"

export const CodeToTrackerName = (code: number) => {
  const map = Object.fromEntries(
    Object.entries(TrackerMapper).map(([key, value]) => [value, key]),
  ) as Record<number, string>
  const name = map[code]
  if (name) {
    return snakeCase(name)
  } else {
    throw new Error(`Tracker name not found for code ${code}`)
  }
}

const snakeCase = (string: string) => {
  return string.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, "")
}
