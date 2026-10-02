import type { Tone } from "./brand"
import { icon } from "./icons"

// Device frames are drawn in CSS so they stay sharp at every export size. Each
// builder takes the outer width in canvas pixels plus the capture's pixel size
// and returns the markup with the resulting outer height.

export interface Capture {
  url: string
  width: number
  height: number
}

export interface FrameResult {
  html: string
  width: number
  height: number
}

export type DeviceKind = "iphone" | "ipad" | "android-phone" | "android-tablet" | "mac" | "windows"

interface PhoneSpec {
  rim: number
  bezel: number
  screenRadius: number
}

const specs: Record<"iphone" | "ipad" | "android-phone" | "android-tablet", PhoneSpec> = {
  // Ratios of the screen width, measured against iPhone 17 Pro Max, iPad Pro 13" (M5),
  // and a Pixel-class Android phone and tablet.
  iphone: { rim: 0.011, bezel: 0.021, screenRadius: 0.125 },
  ipad: { rim: 0.005, bezel: 0.03, screenRadius: 0.02 },
  "android-phone": { rim: 0.009, bezel: 0.02, screenRadius: 0.085 },
  "android-tablet": { rim: 0.005, bezel: 0.032, screenRadius: 0.025 },
}

const rimGradient = (tone: Tone) =>
  tone === "dark"
    ? "linear-gradient(135deg,#5b5652 0%,#2e2a27 22%,#4a4541 50%,#262220 78%,#55504b 100%)"
    : "linear-gradient(135deg,#f1ede9 0%,#b9b2ab 18%,#e7e2dd 45%,#a59e97 75%,#ece7e2 100%)"

const deviceShadow = (tone: Tone, scale: number) =>
  tone === "dark"
    ? `0 ${60 * scale}px ${120 * scale}px -${20 * scale}px rgba(0,0,0,.6), 0 ${16 * scale}px ${40 * scale}px rgba(0,0,0,.35)`
    : `0 ${70 * scale}px ${140 * scale}px -${30 * scale}px rgba(76,36,10,.34), 0 ${18 * scale}px ${44 * scale}px rgba(76,36,10,.14)`

export const handheldFrame = (
  kind: "iphone" | "ipad" | "android-phone" | "android-tablet",
  capture: Capture,
  outerWidth: number,
  tone: Tone,
): FrameResult => {
  const spec = specs[kind]
  const screenW = outerWidth / (1 + 2 * (spec.rim + spec.bezel))
  const rim = screenW * spec.rim
  const bezel = screenW * spec.bezel
  const screenH = (screenW * capture.height) / capture.width
  const outerHeight = screenH + 2 * (rim + bezel)
  const screenRadius = screenW * spec.screenRadius
  const innerRadius = screenRadius + bezel
  const outerRadius = innerRadius + rim
  const scale = outerWidth / 1100

  let hardware = ""
  if (kind === "iphone") {
    const islandW = screenW * 0.285
    const islandH = screenW * 0.083
    hardware = `<div style="position:absolute;left:${(screenW - islandW) / 2}px;top:${screenW * 0.026}px;width:${islandW}px;height:${islandH}px;border-radius:${islandH}px;background:#050505"></div>`
  } else if (kind === "android-phone") {
    const d = screenW * 0.034
    hardware = `<div style="position:absolute;left:${(screenW - d) / 2}px;top:${screenW * 0.028}px;width:${d}px;height:${d}px;border-radius:50%;background:#050505;box-shadow:inset 0 0 ${d * 0.25}px rgba(60,70,90,.8)"></div>`
  }

  // Hardware buttons sit just outside the rim so the silhouette reads as a real device.
  const buttons =
    kind === "iphone" || kind === "android-phone"
      ? [
          { side: "left", top: 0.2, len: 0.055 },
          { side: "left", top: 0.29, len: 0.1 },
          { side: "left", top: 0.41, len: 0.1 },
          { side: "right", top: 0.3, len: 0.15 },
        ]
          .filter((b) => kind === "iphone" || b.side === "right")
          .map(
            (b) =>
              `<div style="position:absolute;${b.side}:${-rim * 0.9}px;top:${outerHeight * b.top}px;width:${rim * 1.4}px;height:${outerHeight * b.len}px;border-radius:${rim}px;background:${rimGradient(tone)}"></div>`,
          )
          .join("")
      : ""

  const html = `
<div class="device" style="position:relative;width:${outerWidth}px;height:${outerHeight}px">
  ${buttons}
  <div style="position:absolute;inset:0;border-radius:${outerRadius}px;background:${rimGradient(tone)};box-shadow:${deviceShadow(tone, scale)}"></div>
  <div style="position:absolute;inset:${rim}px;border-radius:${innerRadius}px;background:#0a0a0a;box-shadow:inset 0 0 0 ${Math.max(1, rim * 0.35)}px rgba(255,255,255,.08)"></div>
  <div style="position:absolute;left:${rim + bezel}px;top:${rim + bezel}px;width:${screenW}px;height:${screenH}px;border-radius:${screenRadius}px;overflow:hidden;background:#fff">
    <img src="${capture.url}" style="display:block;width:100%;height:100%;object-fit:cover" />
    ${hardware}
  </div>
</div>`
  return { html, width: outerWidth, height: outerHeight }
}

export interface WindowOptions {
  // Fill for transparent pixels in the capture (the macOS vibrancy sidebar).
  materialFill?: string
}

// macOS window: the capture is the full web contents of the hiddenInset window,
// so the traffic lights are drawn at the app's configured position (18, 18 pt).
export const macWindow = (
  capture: Capture,
  outerWidth: number,
  tone: Tone,
  options: WindowOptions = {},
): FrameResult => {
  const k = outerWidth / (capture.width / 2) // canvas px per window point
  const height = (outerWidth * capture.height) / capture.width
  const radius = 16 * k
  const light = (color: string, x: number) =>
    `<div style="position:absolute;left:${x * k}px;top:${18 * k}px;width:${12 * k}px;height:${12 * k}px;border-radius:50%;background:${color};box-shadow:inset 0 0 0 ${0.5 * k}px rgba(0,0,0,.18)"></div>`
  const fill =
    options.materialFill ?? (tone === "dark" ? "rgba(44,38,35,.82)" : "rgba(246,242,239,.78)")
  const html = `
<div class="device" style="position:relative;width:${outerWidth}px;height:${height}px">
  <div style="position:absolute;inset:0;border-radius:${radius}px;background:${fill};backdrop-filter:blur(${40 * k}px) saturate(1.6);box-shadow:${deviceShadow(tone, outerWidth / 2200)}, 0 0 0 ${Math.max(1, 0.5 * k)}px rgba(0,0,0,${tone === "dark" ? ".5" : ".12"})"></div>
  <div style="position:absolute;inset:0;border-radius:${radius}px;overflow:hidden">
    <img src="${capture.url}" style="display:block;width:100%;height:100%" />
  </div>
  ${light("#FF5F57", 18)}${light("#FEBC2E", 38)}${light("#28C840", 58)}
  <div style="position:absolute;inset:0;border-radius:${radius}px;box-shadow:inset 0 0 0 ${Math.max(1, 0.5 * k)}px rgba(255,255,255,${tone === "dark" ? ".12" : ".55"});pointer-events:none"></div>
</div>`
  return { html, width: outerWidth, height }
}

// Windows 11 window: Folo draws its own caption buttons on Windows (see
// apps/desktop/layer/renderer/src/modules/app/Titlebar.tsx), 50pt wide and 30pt tall.
export const windowsWindow = (
  capture: Capture,
  outerWidth: number,
  tone: Tone,
  options: WindowOptions = {},
): FrameResult => {
  const k = outerWidth / (capture.width / 2)
  const height = (outerWidth * capture.height) / capture.width
  const radius = 8 * k
  const fg = tone === "dark" ? "#f2f2f2" : "#1f1f1f"
  const buttons = ["minimize-line", "square-line", "close-line"]
    .map(
      (name) =>
        `<div style="width:${50 * k}px;height:${30 * k}px;display:flex;align-items:center;justify-content:center">${icon(name, 14 * k, fg)}</div>`,
    )
    .join("")
  const fill = options.materialFill ?? (tone === "dark" ? "#202020" : "#f3f3f3")
  const html = `
<div class="device" style="position:relative;width:${outerWidth}px;height:${height}px">
  <div style="position:absolute;inset:0;border-radius:${radius}px;background:${fill};box-shadow:0 ${32 * k}px ${64 * k}px rgba(0,0,0,${tone === "dark" ? ".55" : ".26"}), 0 0 0 ${Math.max(1, 0.5 * k)}px rgba(0,0,0,${tone === "dark" ? ".6" : ".14"})"></div>
  <div style="position:absolute;inset:0;border-radius:${radius}px;overflow:hidden">
    <img src="${capture.url}" style="display:block;width:100%;height:100%" />
    <div style="position:absolute;right:0;top:0;display:flex">${buttons}</div>
  </div>
</div>`
  return { html, width: outerWidth, height }
}
