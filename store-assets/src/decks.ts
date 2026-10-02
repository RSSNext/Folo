import type { Tone } from "./brand"
import type { DeviceKind } from "./frames"
import type { Layout } from "./slide"

// Capture devices. Files live at captures/<capture locale>/<device>/<shot>.png.
export type CaptureDevice = "iphone" | "ipad" | "android" | "mac" | "windows"

export interface CalloutSpec {
  shot: string
  rect: [x: number, y: number, w: number, h: number]
  at: [x: number, y: number]
  width: number
  rotate?: number
}

export interface SlideSpec {
  copy: string
  layout: Layout
  tone: Tone
  shots: string[]
  eyebrowIcon: string
  // A second device drawn next to the main one (the sync slide).
  companion?: { device: "mac" | "windows"; shot: string }
  callouts?: CalloutSpec[]
  // Drop copy fields a store does not allow, e.g. proof badges on Google Play.
  omit?: ("badge" | "sub")[]
}

export interface DeckSpec {
  id: string
  store: "app-store" | "google-play" | "microsoft-store"
  captureDevice: CaptureDevice
  frame: DeviceKind
  canvas: { width: number; height: number }
  // Every size the store accepts that we export; the first one is the canvas.
  outputs: { width: number; height: number; format: "png" | "jpeg" }[]
  slides: SlideSpec[]
}

const mobileSlides = (options: { proof: boolean; platform: "apple" | "android" }): SlideSpec[] => [
  {
    copy: "mobile.hero",
    layout: "hero",
    tone: "light",
    shots: ["timeline"],
    eyebrowIcon: "rss-2-fill",
    omit: options.proof ? [] : ["badge"],
  },
  {
    copy: "mobile.summary",
    layout: "device-bottom",
    tone: "dark",
    shots: ["summary"],
    eyebrowIcon: "sparkles-2-fill",
    callouts: [
      {
        shot: "summary",
        rect: [0.03, 0.255, 0.94, 0.355],
        at: [0.05, 0.47],
        width: 0.9,
        rotate: -2,
      },
    ],
  },
  {
    copy: "mobile.translate",
    layout: "device-top",
    tone: "light",
    shots: ["translate"],
    eyebrowIcon: "translate-2-line",
  },
  {
    copy: "mobile.formats",
    layout: "two-devices",
    tone: "light",
    shots: ["pictures", "videos"],
    eyebrowIcon: "pic-fill",
  },
  {
    copy: "mobile.listen",
    layout: "device-bottom",
    tone: "dark",
    shots: ["listen"],
    eyebrowIcon: "headphone-fill",
    callouts: [
      { shot: "listen", rect: [0.03, 0.83, 0.94, 0.066], at: [0.06, 0.64], width: 0.88, rotate: 0 },
    ],
  },
  {
    copy: "mobile.discover",
    layout: "device-top",
    tone: "light",
    shots: ["discover"],
    eyebrowIcon: "compass-3-fill",
  },
  {
    copy: "mobile.sync",
    layout: "sync",
    tone: "light",
    shots: ["timeline"],
    eyebrowIcon: "refresh-3-line",
    companion: { device: options.platform === "apple" ? "mac" : "windows", shot: "hero" },
  },
  {
    copy: "mobile.more",
    layout: "closer",
    tone: "dark",
    shots: ["audios"],
    eyebrowIcon: "star-fill",
  },
]

const desktopSlides: SlideSpec[] = [
  {
    copy: "desktop.hero",
    layout: "split",
    tone: "light",
    shots: ["hero"],
    eyebrowIcon: "rss-2-fill",
  },
  {
    copy: "desktop.chat",
    layout: "hero",
    tone: "light",
    shots: ["chat"],
    eyebrowIcon: "sparkles-2-fill",
  },
  {
    copy: "desktop.digest",
    layout: "split",
    tone: "dark",
    shots: ["digest"],
    eyebrowIcon: "list-check-3-fill",
  },
  {
    copy: "desktop.translate",
    layout: "split-right",
    tone: "light",
    shots: ["translate"],
    eyebrowIcon: "translate-2-line",
  },
  {
    copy: "desktop.formats",
    layout: "two-devices",
    tone: "light",
    shots: ["pictures", "videos"],
    eyebrowIcon: "pic-fill",
  },
  {
    copy: "desktop.tasks",
    layout: "split",
    tone: "dark",
    shots: ["tasks"],
    eyebrowIcon: "magic-2-fill",
  },
  {
    copy: "desktop.integrations",
    layout: "split-right",
    tone: "light",
    shots: ["integrations"],
    eyebrowIcon: "flash-fill",
  },
  {
    copy: "desktop.more",
    layout: "closer",
    tone: "dark",
    shots: ["appearance"],
    eyebrowIcon: "star-fill",
  },
]

// The proof badge only stays on the first desktop poster.
const desktopPosterSlides = desktopSlides.map((s) =>
  s.copy === "desktop.hero" ? s : { ...s, omit: [...(s.omit ?? []), "badge" as const] },
)

export const decks: DeckSpec[] = [
  {
    id: "app-store/iphone",
    store: "app-store",
    captureDevice: "iphone",
    frame: "iphone",
    // 6.9" display; App Store Connect scales it down for smaller iPhones.
    canvas: { width: 1320, height: 2868 },
    outputs: [{ width: 1320, height: 2868, format: "png" }],
    slides: mobileSlides({ proof: true, platform: "apple" }),
  },
  {
    id: "app-store/ipad",
    store: "app-store",
    captureDevice: "ipad",
    frame: "ipad",
    // 13" display.
    canvas: { width: 2064, height: 2752 },
    outputs: [{ width: 2064, height: 2752, format: "png" }],
    slides: mobileSlides({ proof: true, platform: "apple" }),
  },
  {
    id: "app-store/mac",
    store: "app-store",
    captureDevice: "mac",
    frame: "mac",
    canvas: { width: 2880, height: 1800 },
    outputs: [{ width: 2880, height: 1800, format: "png" }],
    slides: desktopPosterSlides,
  },
  {
    id: "google-play/phone",
    store: "google-play",
    captureDevice: "android",
    frame: "android-phone",
    // 9:16 at 1440 wide keeps text crisp and meets the 1080px promotion minimum.
    canvas: { width: 1440, height: 2560 },
    outputs: [{ width: 1440, height: 2560, format: "png" }],
    slides: mobileSlides({ proof: false, platform: "android" }),
  },
  {
    id: "microsoft-store/desktop",
    store: "microsoft-store",
    captureDevice: "windows",
    frame: "windows",
    // Microsoft's guidelines ask for screenshots without marketing text, but
    // Microsoft's own listings (Copilot among them) use posters like the Mac
    // set, so this deck matches it; the screenshot captions repeat the copy.
    canvas: { width: 3840, height: 2160 },
    outputs: [{ width: 3840, height: 2160, format: "png" }],
    slides: desktopPosterSlides,
  },
]
