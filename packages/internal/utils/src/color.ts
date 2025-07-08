import uniqolor from "uniqolor"

const getRandomColor = (lightness: [number, number], saturation: [number, number], hue: number) => {
  const satAccent = Math.floor(Math.random() * (saturation[1] - saturation[0] + 1) + saturation[0])
  const lightAccent = Math.floor(Math.random() * (lightness[1] - lightness[0] + 1) + lightness[0])

  // Generate the background color by increasing the lightness and decreasing the saturation
  const satBackground = satAccent > 30 ? satAccent - 30 : 0
  const lightBackground = lightAccent < 80 ? lightAccent + 20 : 100

  return {
    accent: `hsl(${hue} ${satAccent}% ${lightAccent}%)`,
    background: `hsl(${hue} ${satBackground}% ${lightBackground}%)`,
  }
}

export function stringToHue(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.codePointAt(i)! + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return hue < 0 ? hue + 360 : hue
}

const memoMap = {} as Record<string, ReturnType<typeof getColorScheme>>
export const getColorScheme = (
  hue?: number,
  memo?: boolean,
): {
  light: {
    accent: string
    background: string
  }
  dark: {
    accent: string
    background: string
  }
} => {
  const baseHue = hue ?? Math.floor(Math.random() * 361)
  if (baseHue && memo) {
    if (memoMap[baseHue]) {
      return memoMap[baseHue]
    }
    const result = getColorScheme(baseHue)
    memoMap[baseHue] = result
    return result
  }
  const complementaryHue = (baseHue + 180) % 360

  // For light theme, we limit the lightness between 40 and 70 to avoid too bright colors for accent
  const lightColors = getRandomColor([40, 70], [70, 90], baseHue)

  // For dark theme, we limit the lightness between 20 and 50 to avoid too dark colors for accent
  const darkColors = getRandomColor([20, 50], [70, 90], complementaryHue)

  const result = {
    light: {
      accent: lightColors.accent,
      background: lightColors.background,
    },
    dark: {
      accent: darkColors.accent,
      background: darkColors.background,
    },
  }
  return result
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const hexToRgb = (hex: string) => {
  const bigint = Number.parseInt(hex.slice(1), 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

export const rgbToHex = (r: number, g: number, b: number) => {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

const adjustColorTowardsTarget = (color: string, targetColor: string, factor: number) => {
  const [r1, g1, b1] = hexToRgb(color)
  const [r2, g2, b2] = hexToRgb(targetColor)

  const r = Math.round(lerp(r1!, r2!, factor))
  const g = Math.round(lerp(g1!, g2!, factor))
  const b = Math.round(lerp(b1!, b2!, factor))

  return rgbToHex(r, g, b)
}

export const getBackgroundGradient = (seed?: string | null | undefined) => {
  const nextSeed = seed ?? Math.random().toString(36).slice(7)

  const bgAccent = uniqolor(nextSeed, {
    saturation: [30, 35],
    lightness: [60, 70],
  }).color

  const bgAccentLight = uniqolor(nextSeed, {
    saturation: [30, 35],
    lightness: [80, 90],
  }).color

  const bgAccentUltraLight = uniqolor(nextSeed, {
    saturation: [30, 35],
    lightness: [95, 96],
  }).color

  const targetColor = "#FF5C02"
  const factor = 0.3 // Adjust this value to control how close the color gets to the target color

  const adjustedAccent = adjustColorTowardsTarget(bgAccent, targetColor, factor)
  const adjustedAccentLight = adjustColorTowardsTarget(bgAccentLight, targetColor, factor)
  const adjustedAccentUltraLight = adjustColorTowardsTarget(bgAccentUltraLight, targetColor, factor)

  return [
    adjustedAccent,
    adjustedAccentLight,
    adjustedAccentUltraLight,
    bgAccent,
    bgAccentLight,
    bgAccentUltraLight,
  ]
}

export function getDominantColor(imageObject: HTMLImageElement) {
  const canvas = document.createElement("canvas"),
    ctx = canvas.getContext("2d")!

  canvas.width = 1
  canvas.height = 1

  // draw the image to one pixel and let the browser find the dominant color
  ctx.drawImage(imageObject, 0, 0, 1, 1)

  // get pixel color
  const i = ctx.getImageData(0, 0, 1, 1).data

  return `#${((1 << 24) + (i[0]! << 16) + (i[1]! << 8) + i[2]!).toString(16).slice(1)}`
}
export const getHighestWeightColor = (imageObject: HTMLImageElement): string => {
  const canvas = document.createElement("canvas")
  canvas.width = imageObject.width
  canvas.height = imageObject.height
  const context = canvas.getContext("2d")
  if (!context) {
    return "#000000"
  }
  context.drawImage(imageObject, 0, 0)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  const shift = 4
  const colorCount = new Map<string, number>()

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]! >> shift
    const g = pixels[i + 1]! >> shift
    const b = pixels[i + 2]! >> shift
    const colorKey = `${r},${g},${b}`
    colorCount.set(colorKey, (colorCount.get(colorKey) || 0) + 1)
  }

  let maxCount = 0
  let maxColorKey = ""
  for (const [key, count] of colorCount) {
    if (count > maxCount) {
      maxCount = count
      maxColorKey = key
    }
  }

  const [targetR, targetG, targetB] = maxColorKey.split(",").map(Number)
  let sumR = 0
  let sumG = 0
  let sumB = 0
  let count = 0
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]! >> shift
    const g = pixels[i + 1]! >> shift
    const b = pixels[i + 2]! >> shift
    if (r === targetR && g === targetG && b === targetB) {
      sumR += pixels[i]!
      sumG += pixels[i + 1]!
      sumB += pixels[i + 2]!
      count++
    }
  }
  const avgR = Math.round(sumR / count)
  const avgG = Math.round(sumG / count)
  const avgB = Math.round(sumB / count)
  return rgbToHex(avgR, avgG, avgB)
}

export const isHexColor = (color: string) => {
  return /^#[0-9a-f]{6}$/i.test(color)
}

export const isRGBColor = (color: string) => {
  return /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(color)
}
export const isRGBAColor = (color: string) => {
  return /^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(?:0?\.\d+|1(?:\.0+)?)\)$/.test(color)
}

export const withOpacity = (color: string, opacity: number) => {
  switch (true) {
    case isHexColor(color): {
      // Convert decimal opacity to hex (0-255)
      const alpha = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")
      return `${color}${alpha}`
    }
    case isRGBColor(color): {
      const [r, g, b] = color.match(/\d+/g)!.map(Number)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    case isRGBAColor(color): {
      const [r, g, b] = color.match(/\d+/g)!.map(Number)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    default: {
      return color
    }
  }
}
export const rgbStringToRgb = (hex: string) => {
  const [r, g, b, a] = hex.split(" ").map((s) => Number.parseFloat(s))
  return `rgba(${r}, ${g}, ${b}, ${a || 1})`
}

export const getLuminance = (hexColor: string) => {
  const rgb = Number.parseInt(hexColor.replace("#", ""), 16)
  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = (rgb >> 0) & 0xff
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export const shadeColor = (color: string, percent: number): string => {
  const R = Number.parseInt(color.slice(1, 3), 16)
  const G = Number.parseInt(color.slice(3, 5), 16)
  const B = Number.parseInt(color.slice(5, 7), 16)

  let newR = Math.round((R * (100 + percent)) / 100)
  let newG = Math.round((G * (100 + percent)) / 100)
  let newB = Math.round((B * (100 + percent)) / 100)

  newR = Math.min(newR, 255)
  newG = Math.min(newG, 255)
  newB = Math.min(newB, 255)

  const RR = newR.toString(16).length === 1 ? `0${newR.toString(16)}` : newR.toString(16)
  const GG = newG.toString(16).length === 1 ? `0${newG.toString(16)}` : newG.toString(16)
  const BB = newB.toString(16).length === 1 ? `0${newB.toString(16)}` : newB.toString(16)

  return `#${RR}${GG}${BB}`
}
export function hexToHslString(hex: string): string {
  let raw = hex.replace(/^#/, "")

  if (raw.length === 3) {
    raw = raw
      .split("")
      .map((ch) => ch + ch)
      .join("")
  }
  if (!/^[0-9a-f]{6}$/i.test(raw)) {
    throw new Error(`非法 hex 颜色值: ${hex}`)
  }

  const r = Number.parseInt(raw.slice(0, 2), 16) / 255
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  const l = (max + min) / 2

  let s = 0
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1))
  }

  let h = 0
  if (delta !== 0) {
    switch (max) {
      case r: {
        h = ((g - b) / delta) % 6
        break
      }
      case g: {
        h = (b - r) / delta + 2
        break
      }
      case b: {
        h = (r - g) / delta + 4
        break
      }
    }
    h *= 60
    if (h < 0) h += 360
  }

  const hStr = h.toFixed(1)
  const sStr = `${Math.round(s * 100)}%`
  const lStr = `${Math.round(l * 100)}%`

  return `${hStr} ${sStr} ${lStr}`
}
