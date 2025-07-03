import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import dayjs from "dayjs"
import { extendTailwindMerge } from "tailwind-merge"
import { parse } from "tldts"

type Nullable<T> = T | null | undefined

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "largeTitle",
        "title1",
        "title2",
        "title3",
        "headline",
        "body",
        "callout",
        "subheadline",
        "footnote",
        "caption",
      ],
    },
  },
})
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export { clsx } from "clsx"
export type OS = "macOS" | "iOS" | "Windows" | "Android" | "Linux" | ""

declare const window: {
  platform: NodeJS.Platform
  navigator: Navigator
}
declare const ELECTRON: boolean

export const once = <T>(fn: () => T): (() => T) => {
  let first = true
  let value: T
  return () => {
    if (first) {
      first = false
      value = fn()
      return value
    }
    return value
  }
}

export const getOS = once((): OS => {
  if (window.platform) {
    switch (window.platform) {
      case "darwin": {
        return "macOS"
      }
      case "win32": {
        return "Windows"
      }
      case "linux": {
        return "Linux"
      }
    }
  }

  const { userAgent } = window.navigator,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    iosPlatforms = ["iPhone", "iPad", "iPod"]
  // @ts-expect-error
  const platform = window.navigator.userAgentData?.platform || window.navigator.platform
  let os = platform

  if (macosPlatforms.includes(platform)) {
    os = "macOS"
  } else if (iosPlatforms.includes(platform)) {
    os = "iOS"
  } else if (windowsPlatforms.includes(platform)) {
    os = "Windows"
  } else if (/Android/.test(userAgent)) {
    os = "Android"
  } else if (!os && /Linux/.test(platform)) {
    os = "Linux"
  }

  return os as OS
})

export function detectBrowser() {
  const { userAgent } = navigator
  if (userAgent.includes("Edg")) {
    return "Microsoft Edge"
  } else if (userAgent.includes("Chrome")) {
    return "Chrome"
  } else if (userAgent.includes("Firefox")) {
    return "Firefox"
  } else if (userAgent.includes("Safari")) {
    return "Safari"
  } else if (userAgent.includes("Opera")) {
    return "Opera"
  } else if (userAgent.includes("Trident") || userAgent.includes("MSIE")) {
    return "Internet Explorer"
  }

  return "Unknown"
}

export const isSafari = once(() => {
  if (ELECTRON) return false
  const ua = window.navigator.userAgent
  return (ua.includes("Safari") || ua.includes("AppleWebKit")) && !ua.includes("Chrome")
})

// eslint-disable-next-line no-control-regex
export const isASCII = (str: string) => /^[\u0000-\u007F]*$/.test(str)

const EPOCH = 1712546615000n // follow repo created
const MAX_TIMESTAMP_BITS = 41n // Maximum number of bits typically used for timestamp

export const isBizId = (id: string | undefined): boolean => {
  if (!id || !/^\d{13,19}$/.test(id)) return false

  const snowflake = BigInt(id)

  // Extract the timestamp assuming it's in the most significant bits after the sign bit
  const timestamp = (snowflake >> (63n - MAX_TIMESTAMP_BITS)) + EPOCH
  const date = new Date(Number(timestamp))

  // Check if the date is reasonable (between 2024 and 2050)
  if (date.getFullYear() >= 2024 && date.getFullYear() <= 2050) {
    // Additional validation: check if the ID is not larger than the maximum possible value
    const maxPossibleId = (1n << 63n) - 1n // Maximum possible 63-bit value
    if (snowflake <= maxPossibleId) {
      return true
    }
  }

  return false
}

export function formatXml(xml: string, indent = 4) {
  const PADDING = " ".repeat(indent)
  let formatted = ""
  const regex = /(>)(<)(\/*)/g
  const xmlStr = xml.replaceAll(regex, "$1\r\n$2$3")
  let pad = 0
  xmlStr.split("\r\n").forEach((node) => {
    let indent = 0
    if (/.+<\/\w[^>]*>$/.test(node)) {
      indent = 0
    } else if (/^<\/\w/.test(node) && pad !== 0) {
      pad -= 1
    } else if (/^<\w(?:[^>]*[^/])?>.*$/.test(node)) {
      indent = 1
    } else {
      indent = 0
    }

    formatted += `${PADDING.repeat(pad) + node}\r\n`
    pad += indent
  })

  return formatted.trim()
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const capitalizeFirstLetter = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1)

export const omitObjectUndefinedValue = (obj: Record<string, any>) => {
  const newObj = {} as any
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

export const sortByAlphabet = (a: string, b: string) => {
  const isALetter = /^[a-z]/i.test(a)
  const isBLetter = /^[a-z]/i.test(b)

  if (isALetter && !isBLetter) {
    return -1
  }
  if (!isALetter && isBLetter) {
    return 1
  }

  if (isALetter && isBLetter) {
    return a.localeCompare(b)
  }

  return a.localeCompare(b, "zh-CN")
}

export const isEmptyObject = (obj: Record<string, any>) => Object.keys(obj).length === 0

export const parseSafeUrl = (url: string) => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

/**
 * @deprecated Remove it in the future but not now
 */
export const resolveUrlWithBase = (url: string, baseUrl: string) => {
  try {
    return new URL(url, baseUrl).href
  } catch {
    return url
  }
}

export const getUrlIcon = (url: string, fallback?: boolean | undefined) => {
  let src: string
  let fallbackUrl = ""

  try {
    const { host } = new URL(url)
    const pureDomain = parse(host).domainWithoutSuffix
    fallbackUrl = `https://avatar.vercel.sh/${pureDomain}.svg?text=${pureDomain
      ?.slice(0, 2)
      .toUpperCase()}`
    src = `https://unavatar.webp.se/${host}?fallback=${fallback || false}`
  } catch {
    const pureDomain = parse(url).domainWithoutSuffix
    src = `https://avatar.vercel.sh/${pureDomain}.svg?text=${pureDomain?.slice(0, 2).toUpperCase()}`
  }
  const ret = {
    src,
    fallbackUrl,
  }

  return ret
}

export { parse as parseUrl } from "tldts"

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

export function shallowCopy<T>(input: T): T {
  if (Array.isArray(input)) {
    return [...input] as T
  } else if (input && typeof input === "object") {
    return { ...input } as T
  }
  return input
}

export function isKeyForMultiSelectPressed(e: MouseEvent) {
  if (getOS() === "macOS") {
    return e.metaKey || e.shiftKey
  }
  return e.ctrlKey || e.shiftKey
}

export const toScientificNotation = (
  num: readonly [bigint, number] | bigint,
  threshold: number,
  locale?: Intl.Locale | string,
) => {
  // Handle string input by converting to dnum format
  let value: bigint
  let decimals: number

  if (typeof num === "bigint") {
    decimals = 0
    value = num
  } else {
    // Extract number from dnum tuple
    ;[value, decimals] = num
  }

  // Convert to decimal string representation
  const valueAsString = value.toString()

  // Handle zero case
  if (valueAsString === "0") return "0"

  // Determine length of the integer part
  const integerLength = valueAsString.length > decimals ? valueAsString.length - decimals : 0

  // Return normal formatted number if below threshold
  if (integerLength <= threshold) {
    // Use provided locale or default to en-US
    const localeString = locale?.toString() || "en-US"
    const formatter = new Intl.NumberFormat(localeString, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })

    // Convert bigint to number with correct decimal places
    const asNumber = Number(value) / Math.pow(10, decimals)
    return formatter.format(asNumber)
  }

  // Format in scientific notation
  // Insert decimal point at appropriate place
  let normalizedNumStr = valueAsString
  if (valueAsString.length <= decimals) {
    // Need to pad with leading zeros
    normalizedNumStr = "0".repeat(decimals - valueAsString.length + 1) + valueAsString
  }

  // Find first non-zero digit
  const firstNonZeroIndex = normalizedNumStr.search(/[1-9]/)
  if (firstNonZeroIndex === -1) return "0" // All zeros

  // Get first digits for the significand
  const significandDigits = normalizedNumStr.slice(
    firstNonZeroIndex,
    Math.min(firstNonZeroIndex + 3, normalizedNumStr.length),
  )

  // Calculate exponent
  const exponent = integerLength - 1

  // Format significand according to locale
  const localeString = locale?.toString() || "en-US"
  const formatter = new Intl.NumberFormat(localeString, {
    maximumFractionDigits: significandDigits.length - 1,
  })

  // Create significand as a properly formatted decimal
  const firstDigit = Number(significandDigits[0])
  const remainingDigits = significandDigits.slice(1)
  const significandNumber = Number(`${firstDigit}.${remainingDigits}`)
  const formattedSignificand = formatter.format(significandNumber)

  // Format the exponent marker according to locale
  // Many locales use "×10^" notation instead of "e+"
  const useENotation = localeString.startsWith("en")

  if (useENotation) {
    return `${formattedSignificand}e+${exponent}`
  } else {
    return `${formattedSignificand}×10^${exponent}`
  }
}

export function transformShortcut(shortcut: string, platform: OS = getOS()): string {
  if (platform === "macOS") {
    return shortcut.replace("$mod", "Meta")
  }
  return shortcut.replace("$mod", "Control")
}

const F_KEY_REGEX = /^F(?:[1-9]|1[0-2])$/

function getKeySortValue(key: string): number {
  const order = ["Shift", "Control", "Meta", "Alt"]

  if (order.includes(key)) {
    return order.indexOf(key)
  }

  if (F_KEY_REGEX.test(key)) return 4
  return 5
}

export function sortShortcutKeys(keys: string[]): string[] {
  return [...keys].sort((a, b) => {
    const sortValueA = getKeySortValue(a)
    const sortValueB = getKeySortValue(b)
    if (sortValueA !== sortValueB) {
      return sortValueA - sortValueB
    }

    return a.localeCompare(b)
  })
}

// time like 1:30:00
export const formatTimeToSeconds = (time?: string | number) => {
  if (typeof time === "number" || time === undefined) {
    return time
  }

  const formats = ["h:mm:ss", "mm:ss", "m:ss"]

  for (const format of formats) {
    const date = dayjs(time, format)
    if (date.isValid()) {
      const totalSeconds = date.hour() * 3600 + date.minute() * 60 + date.second()
      return totalSeconds
    }
  }
}

export const formatEstimatedMins = (estimatedMins: number) => {
  const minutesInHour = 60
  const minutesInDay = minutesInHour * 24
  const minutesInMonth = minutesInDay * 30

  const months = Math.floor(estimatedMins / minutesInMonth)
  const days = Math.floor((estimatedMins % minutesInMonth) / minutesInDay)
  const hours = Math.floor((estimatedMins % minutesInDay) / minutesInHour)
  const minutes = estimatedMins % minutesInHour

  if (months > 0) {
    return `${months}M ${days}d`
  }
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${estimatedMins} mins`
}

export const omitShallow = (obj: any, ...keys: string[]) => {
  if (!obj) return obj
  if (typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj

  const nextObj = { ...obj }
  for (const key of keys) {
    Reflect.deleteProperty(nextObj, key)
  }
  return nextObj
}

export function duplicateIfLengthLessThan(text: string, length: number) {
  return text.length > 0 && text.length < length
    ? text.repeat(Math.ceil(length / text.length))
    : text
}

export function combineCleanupFunctions(...fns: Array<Nullable<(() => void) | void>>) {
  return () => {
    fns.forEach((fn) => {
      if (typeof fn === "function") {
        fn()
      }
    })
  }
}

export function doesTextContainHTML(text?: string | null): boolean {
  if (!text) return false
  return /<([a-z][a-z0-9]*)\b[^>]*>\s*[^<>\s].*<\/\1>/i.test(text)
}

/**
 * Format number to a more readable format
 * @param num - The number to format
 * @returns The formatted number
 */
export function formatNumber(num: number): string {
  // Handle negative numbers
  const isNegative = num < 0
  const absNum = Math.abs(num)

  // Define thresholds
  const billion = 1_000_000_000
  const million = 1_000_000
  const thousand = 1_000

  // Format based on number size
  if (absNum >= billion) {
    return `${isNegative ? "-" : ""}${(absNum / billion).toFixed(1)}B`
  } else if (absNum >= million) {
    return `${isNegative ? "-" : ""}${(absNum / million).toFixed(1)}M`
  } else if (absNum >= thousand) {
    return `${isNegative ? "-" : ""}${(absNum / thousand).toFixed(1)}K`
  }

  return `${isNegative ? "-" : ""}${absNum}`
}
