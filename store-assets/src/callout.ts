import { readFile, writeFile } from "node:fs/promises"

// A capture can come with a sidecar `<shot>.json` naming the region a slide
// callout should enlarge (the AI summary card, the player bar). The capture
// scripts measure it on the device, because where those elements sit differs
// between iPhone, iPad and Android and between entries.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface Sidecar {
  // Fractions of the screenshot.
  callout?: Rect
}

export const writeCallout = async (
  path: string,
  rect: Rect,
  screen: { width: number; height: number },
) => {
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const x = clamp(rect.x / screen.width)
  const y = clamp(rect.y / screen.height)
  const sidecar: Sidecar = {
    callout: {
      x,
      y,
      width: clamp((rect.x + rect.width) / screen.width) - x,
      height: clamp((rect.y + rect.height) / screen.height) - y,
    },
  }
  await writeFile(path, `${JSON.stringify(sidecar, null, 2)}\n`)
}

export const readCallout = async (path: string): Promise<Rect | null> => {
  const raw = await readFile(path, "utf8").catch(() => null)
  if (!raw) return null
  return (JSON.parse(raw) as Sidecar).callout ?? null
}

// Bounding box of several rects, grown by a margin on every side.
export const around = (rects: Rect[], margin: { x: number; y: number }): Rect => {
  const left = Math.min(...rects.map((r) => r.x)) - margin.x
  const top = Math.min(...rects.map((r) => r.y)) - margin.y
  const right = Math.max(...rects.map((r) => r.x + r.width)) + margin.x
  const bottom = Math.max(...rects.map((r) => r.y + r.height)) + margin.y
  return { x: left, y: top, width: right - left, height: bottom - top }
}
