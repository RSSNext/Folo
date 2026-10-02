import { createRequire } from "node:module"

interface IconifyJSON {
  width?: number
  height?: number
  icons: Record<string, { body: string; width?: number; height?: number }>
}

const require = createRequire(import.meta.url)
// MingCute is the icon set the apps use (i-mgc-* / i-mingcute-*), Apache-2.0 via Iconify.
const mingcute = require("@iconify-json/mingcute/icons.json") as IconifyJSON

export const icon = (name: string, size: number, color = "currentColor") => {
  const data = mingcute.icons[name]
  if (!data) throw new Error(`Unknown MingCute icon: ${name}`)
  const w = data.width ?? mingcute.width ?? 24
  const h = data.height ?? mingcute.height ?? 24
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${w} ${h}" style="color:${color};flex:none">${data.body}</svg>`
}

// Folo mark from apps/desktop/layer/renderer/public/icon.svg.
export const foloLogo = (size: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="flex:none"><path fill="#ff5c00" d="M5.382 0h13.236A5.37 5.37 0 0 1 24 5.383v13.235A5.37 5.37 0 0 1 18.618 24H5.382A5.37 5.37 0 0 1 0 18.618V5.383A5.37 5.37 0 0 1 5.382.001Z"/><path fill="#fff" d="M13.269 17.31a1.813 1.813 0 1 0-3.626.002 1.813 1.813 0 0 0 3.626-.002m-.535-6.527H7.213a1.813 1.813 0 1 0 0 3.624h5.521a1.813 1.813 0 1 0 0-3.624m4.417-4.712H8.87a1.813 1.813 0 1 0 0 3.625h8.283a1.813 1.813 0 1 0 0-3.624z"/></svg>`

// The white glyph alone, for placing the mark on custom surfaces.
export const foloGlyph = (size: number, color = "#fff") =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" style="flex:none"><path fill="${color}" d="M13.269 17.31a1.813 1.813 0 1 0-3.626.002 1.813 1.813 0 0 0 3.626-.002m-.535-6.527H7.213a1.813 1.813 0 1 0 0 3.624h5.521a1.813 1.813 0 1 0 0-3.624m4.417-4.712H8.87a1.813 1.813 0 1 0 0 3.625h8.283a1.813 1.813 0 1 0 0-3.624z"/></svg>`
