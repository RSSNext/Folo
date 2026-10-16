// Renders a release announcement video (1920 × 1080, 30 fps, H.264, no sound) from a JSON
// spec and the app captures, in the look of the store slides: an intro with the versions,
// one scene per highlight and an outro with the download link.
//   tsx store-assets/scripts/release-video.ts <spec.json> --stills <dir> [--captures <dir>]
//   tsx store-assets/scripts/release-video.ts <spec.json> --video <out.mp4> [--captures <dir>]
// The spec is a VideoSpec (below); promo/example.json uses every layout. Shots name captures
// without the extension, e.g. "en/mac/hero", and the device folder picks the frame.
// Both modes print the timeline and each shot's capture time, and report copy that wraps or
// leaves its area. --stills writes one frame per scene plus contact-sheet.png and exits 1 on
// problems; --video renders nothing until they are fixed, and needs ffmpeg.
// The page is one HTML document of CSS animations. Each frame pauses every animation at the
// frame's time, takes a screenshot and pipes it to ffmpeg, so the output is frame-exact
// however long a frame takes to render.
import { spawn, spawnSync } from "node:child_process"
import { once } from "node:events"
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { pathToFileURL } from "node:url"

import { join, resolve } from "pathe"
import type { Page } from "playwright"
import { chromium } from "playwright"
import sharp from "sharp"

import { brand, googleFontsHref } from "../src/brand"
import type { Rect } from "../src/callout"
import { readCallout } from "../src/callout"
import type { Capture } from "../src/frames"
import { handheldFrame } from "../src/frames"
import { foloLogo, icon } from "../src/icons"

type Visual =
  // A Mac window; several shots crossfade in order.
  | { layout: "mac"; mac: string | string[] }
  // A Mac window next to a phone, for changes that span devices.
  | { layout: "mac-phone"; mac: string; phone: string; badge?: { icon: string; spin?: boolean } }
  // One or two phones. `callout` names a shot whose <shot>.json sidecar marks a region (the
  // player bar of `listen`, the AI card of `summary`) to enlarge in front of them.
  | { layout: "phones"; phones: string[]; callout?: string }

interface SceneSpec {
  // Time on screen in ms, 4600 by default; a Mac crossfade gets at least what it needs.
  duration?: number
  // A MingCute icon name and a few words naming the area.
  eyebrow: { icon: string; text: string }
  // One or two short lines; *text* gets the accent gradient. The type shrinks until every
  // line fits the copy column.
  headline: string[]
  // One sentence under the headline.
  sub?: string
  // Names lit one by one along with the Mac crossfade, then all together (languages).
  chips?: string[]
  // A check list, one line per item (fixes).
  items?: string[]
  visual: Visual
}

interface VideoSpec {
  // The released versions; leave one out for a single-app release.
  desktop?: string
  mobile?: string
  scenes: SceneSpec[]
}

interface Shot extends Capture {
  device: string
  takenAt: Date
}

interface Slot {
  name: string
  start: number
  end: number
}

const W = 1920
const H = 1080
const FPS = 30
const INTRO = 3200
const OUTRO = 3200
const SCENE = 4600
// Time between the steps of a Mac crossfade.
const STEP = 1400
const FADE_OUT = 450
// Copy stays left of this line; the devices start right of it.
const COPY_RIGHT = 840
// Text keeps this distance from the canvas edges.
const SAFE = 40

const root = join(import.meta.dirname, "..")
const args = process.argv.slice(2)
const option = (name: string) => {
  const index = args.indexOf(`--${name}`)
  return index === -1 ? null : (args[index + 1] ?? null)
}
const specPath = args[0]
const stillsDir = option("stills")
const videoPath = option("video")
const capturesDir = resolve(option("captures") ?? join(root, "captures"))
if (!specPath || specPath.startsWith("--") || (!stillsDir && !videoPath)) {
  throw new Error(
    "Usage: release-video.ts <spec.json> (--stills <dir> | --video <out.mp4>) [--captures <dir>]",
  )
}

const spec = JSON.parse(await readFile(specPath, "utf8")) as VideoSpec

const versions: { icon: string; label: string; version: string }[] = []
if (spec.desktop) versions.push({ icon: "computer-line", label: "Desktop", version: spec.desktop })
if (spec.mobile) versions.push({ icon: "cellphone-line", label: "Mobile", version: spec.mobile })
if (versions.length === 0) throw new Error("The spec names no desktop or mobile version")
if (spec.scenes.length === 0) throw new Error("The spec has no scenes")

const deviceOf = (ref: string) => ref.split("/")[1] ?? ""
const expectDevice = (ref: string, devices: string[]) => {
  if (!devices.includes(deviceOf(ref))) {
    throw new Error(`${ref}: expected a ${devices.join(" or ")} capture`)
  }
  return ref
}
const phoneDevices = ["iphone", "android"]

const macShots = (visual: Visual) => (visual.layout === "mac" ? [visual.mac].flat() : [])

const shotRefs = (visual: Visual): string[] => {
  switch (visual.layout) {
    case "mac": {
      return macShots(visual).map((ref) => expectDevice(ref, ["mac"]))
    }
    case "mac-phone": {
      return [expectDevice(visual.mac, ["mac"]), expectDevice(visual.phone, phoneDevices)]
    }
    case "phones": {
      if (visual.phones.length < 1 || visual.phones.length > 2) {
        throw new Error(`The phones layout takes one or two phones, not ${visual.phones.length}`)
      }
      const refs = visual.phones.map((ref) => expectDevice(ref, phoneDevices))
      return visual.callout ? [...refs, expectDevice(visual.callout, phoneDevices)] : refs
    }
    default: {
      throw new Error(`Unknown visual ${JSON.stringify(visual)}`)
    }
  }
}

for (const [i, scene] of spec.scenes.entries()) {
  if (scene.headline.length < 1 || scene.headline.length > 2) {
    throw new Error(`Scene ${i + 1}: the headline takes one or two lines`)
  }
}

const localTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const shots = new Map<string, Shot>()
const missing: string[] = []
for (const ref of new Set(spec.scenes.flatMap((scene) => shotRefs(scene.visual)))) {
  const path = join(capturesDir, `${ref}.png`)
  const info = await stat(path).catch(() => null)
  if (!info) {
    missing.push(path)
    continue
  }
  const { width, height } = await sharp(path).metadata()
  shots.set(ref, {
    url: pathToFileURL(path).href,
    width: width!,
    height: height!,
    device: deviceOf(ref),
    takenAt: info.mtime,
  })
}
if (missing.length > 0) throw new Error(`Missing captures:\n${missing.join("\n")}`)
const shot = (ref: string) => shots.get(ref)!

const callouts = new Map<string, Rect>()
for (const scene of spec.scenes) {
  if (scene.visual.layout !== "phones" || !scene.visual.callout) continue
  const ref = scene.visual.callout
  const rect = await readCallout(join(capturesDir, `${ref}.json`))
  if (!rect) throw new Error(`${ref} has no callout region (${ref}.json)`)
  callouts.set(ref, rect)
}

const sceneLength = (scene: SceneSpec) => {
  const steps = macShots(scene.visual).length
  return Math.max(scene.duration ?? SCENE, steps > 1 ? 1300 + steps * STEP : 0)
}
const slug = (text: string) =>
  text
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "")

const lengths: [string, number][] = [
  ["intro", INTRO],
  ...spec.scenes.map((scene): [string, number] => [
    slug(scene.eyebrow.text) || "scene",
    sceneLength(scene),
  ]),
  ["outro", OUTRO],
]
const slots: Slot[] = []
let clock = 0
for (const [name, length] of lengths) {
  slots.push({ name, start: clock, end: clock + length })
  clock += length
}
const TOTAL = clock

// --- markup ------------------------------------------------------------------

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
const rich = (text: string) => escapeHtml(text).replaceAll(/\*([^*]+)\*/g, "<em>$1</em>")

const enter = (name: string, start: number, duration: number) =>
  `${name} ${duration}ms cubic-bezier(.16,1,.3,1) ${start}ms both`

const section = (slot: Slot, body: string) => {
  const animations = [`show 1ms linear ${slot.start}ms both`]
  if (slot.end < TOTAL) {
    animations.push(
      `fade-out ${FADE_OUT}ms cubic-bezier(.7,0,.84,0) ${slot.end - FADE_OUT}ms forwards`,
    )
  }
  return `<section class="scene" style="animation:${animations.join(",")}">${body}</section>`
}

// macOS window like macWindow in frames.ts, with stacked shots that can crossfade. The
// captures leave the vibrancy sidebar transparent, so every layer gets an opaque fill;
// otherwise the sidebars of the shots below show through.
const macStack = (layers: { shot: Shot; animation?: string }[], outerWidth: number) => {
  const first = layers[0]!.shot
  const k = outerWidth / (first.width / 2)
  const height = (outerWidth * first.height) / first.width
  const radius = 16 * k
  const hairline = Math.max(1, 0.5 * k)
  const light = (color: string, x: number) =>
    `<div style="position:absolute;left:${x * k}px;top:${18 * k}px;width:${12 * k}px;height:${12 * k}px;border-radius:50%;background:${color};box-shadow:inset 0 0 0 ${0.5 * k}px rgba(0,0,0,.18)"></div>`
  const images = layers
    .map(
      (layer) =>
        `<img src="${layer.shot.url}" style="position:absolute;inset:0;display:block;width:100%;height:100%;background:#f6f2ef${layer.animation ? `;animation:${layer.animation}` : ""}" />`,
    )
    .join("")
  const html = `
<div class="device" style="position:relative;width:${outerWidth}px;height:${height}px">
  <div style="position:absolute;inset:0;border-radius:${radius}px;background:rgba(246,242,239,.92);box-shadow:0 ${70 * k}px ${140 * k}px -${30 * k}px rgba(76,36,10,.34), 0 ${18 * k}px ${44 * k}px rgba(76,36,10,.14), 0 0 0 ${hairline}px rgba(0,0,0,.12)"></div>
  <div style="position:absolute;inset:0;border-radius:${radius}px;overflow:hidden">${images}</div>
  ${light("#FF5F57", 18)}${light("#FEBC2E", 38)}${light("#28C840", 58)}
  <div style="position:absolute;inset:0;border-radius:${radius}px;box-shadow:inset 0 0 0 ${hairline}px rgba(255,255,255,.55);pointer-events:none"></div>
</div>`
  return { html, height }
}

const phoneFrame = (ref: string, width: number) => {
  const capture = shot(ref)
  return handheldFrame(
    capture.device === "iphone" ? "iphone" : "android-phone",
    capture,
    width,
    "light",
  )
}

// Enlarges the sidecar region of a phone capture, centered on centerX near the bottom.
const callout = (ref: string, start: number, centerX: number) => {
  const capture = shot(ref)
  const rect = callouts.get(ref)!
  const regionWidth = rect.width * capture.width
  const regionHeight = rect.height * capture.height
  const width = Math.min(660, (360 * regionWidth) / regionHeight)
  const scale = width / regionWidth
  const height = regionHeight * scale
  const top = Math.min(860, H - 110 - height)
  return `<div class="abs callout" style="left:${centerX - width / 2}px;top:${top}px;width:${width}px;height:${height}px;background-image:url('${capture.url}');background-size:${capture.width * scale}px ${capture.height * scale}px;background-position:-${rect.x * capture.width * scale}px -${rect.y * capture.height * scale}px;animation:${enter("pop", start + 1500, 900)},glow 1800ms ease-in-out ${start + 2400}ms 2"></div>`
}

// The devices on the right half of a scene.
const stage = (scene: SceneSpec, slot: Slot, steps: number[]) => {
  const { start, end } = slot
  const drift = `drift ${end - start}ms linear ${start}ms both`
  const { visual } = scene
  switch (visual.layout) {
    case "mac": {
      const layers = macShots(visual).map((ref, i) => ({
        shot: shot(ref),
        animation: i === 0 ? undefined : `fade-in 600ms ease ${steps[i]}ms both`,
      }))
      const mac = macStack(layers, 1000)
      return `<div class="abs" style="left:860px;top:${(H - mac.height) / 2 - 30}px;animation:${enter("in-right", start + 250, 1100)}"><div style="animation:${drift}">${mac.html}</div></div>`
    }
    case "mac-phone": {
      const mac = macStack([{ shot: shot(visual.mac) }], 740)
      const phone = phoneFrame(visual.phone, 260)
      const badge = visual.badge
        ? `<div class="abs badge" style="left:1556px;top:${H / 2 - 56}px;animation:${enter("pop", start + 1000, 800)}"><div style="${visual.badge.spin ? `animation:spin 2400ms linear ${start}ms infinite` : ""}">${icon(visual.badge.icon, 56, "#fff")}</div></div>`
        : ""
      return `
<div class="abs" style="left:850px;top:${(H - mac.height) / 2}px;animation:${enter("in-right", start + 250, 1100)}"><div style="animation:${drift}">${mac.html}</div></div>
<div class="abs" style="left:1630px;top:${(H - phone.height) / 2}px;animation:${enter("in-up", start + 550, 1100)}">${phone.html}</div>
${badge}`
    }
    case "phones": {
      // Two phones overlap the right half; a single one sits in its middle.
      const places =
        visual.phones.length === 1
          ? [{ left: 1180, width: 400, lift: 30 }]
          : [
              { left: 870, width: 350, lift: 15 },
              { left: 1300, width: 360, lift: 40 },
            ]
      const phones = visual.phones
        .map((ref, i) => {
          const place = places[i]!
          const phone = phoneFrame(ref, place.width)
          return `<div class="abs" style="left:${place.left}px;top:${(H - phone.height) / 2 - place.lift}px;animation:${enter("in-up", start + 300 + i * 150, 1100)}">${phone.html}</div>`
        })
        .join("")
      const centerX = visual.phones.length === 1 ? 1380 : 1120
      return phones + (visual.callout ? callout(visual.callout, start, centerX) : "")
    }
    default: {
      throw new Error(`Unknown visual ${JSON.stringify(visual)}`)
    }
  }
}

const featureScene = (scene: SceneSpec, slot: Slot) => {
  const { start } = slot
  // The first Mac shot shows from the start; shot i fades in at steps[i], and its chip
  // lights up at the same time. After the last step every chip lights up.
  const stepCount = macShots(scene.visual).length
  const steps = Array.from({ length: stepCount }, (_, i) =>
    i === 0 ? start + 300 : start + 500 + i * STEP,
  )
  const allOn = stepCount > 1 ? start + 300 + stepCount * STEP : start + 1500
  const chip = (label: string, i: number) => {
    const animations = [enter("in-up", start + 700, 800)]
    if (stepCount > 1 && i < stepCount) {
      animations.push(`chip-on 300ms ease ${steps[i]}ms both`)
      if (i < stepCount - 1) {
        animations.push(
          `chip-off 300ms ease ${steps[i + 1]}ms forwards`,
          `chip-on 300ms ease ${allOn}ms forwards`,
        )
      }
    } else {
      animations.push(`chip-on 300ms ease ${allOn}ms both`)
    }
    return `<span class="chip" style="animation:${animations.join(",")}"><span class="t">${escapeHtml(label)}</span></span>`
  }

  const copy = [
    `<div class="eyebrow" style="animation:${enter("in-up", start + 100, 800)}">${icon(scene.eyebrow.icon, 34, brand.accent)}<span class="t">${escapeHtml(scene.eyebrow.text)}</span></div>`,
    `<h1 class="headline" style="font-size:92px">${scene.headline
      .map(
        (line, i) =>
          `<span class="line" style="animation:${enter("in-up", start + 220 + i * 110, 900)}"><span class="t">${rich(line)}</span></span>`,
      )
      .join("")}</h1>`,
    scene.sub
      ? `<p class="sub t-wrap" style="animation:${enter("in-up", start + 520, 900)}">${rich(scene.sub)}</p>`
      : "",
    scene.chips?.length ? `<div class="chips">${scene.chips.map(chip).join("")}</div>` : "",
    scene.items?.length
      ? `<ul class="items">${scene.items
          .map(
            (item, i) =>
              `<li style="animation:${enter("in-up", start + 700 + i * 140, 700)}">${icon("check-line", 30, brand.accent)}<span class="t">${rich(item)}</span></li>`,
          )
          .join("")}</ul>`
      : "",
  ].join("")

  return section(slot, `<div class="copy">${copy}</div>${stage(scene, slot, steps)}`)
}

const intro = (slot: Slot) => {
  const { start } = slot
  const pills = versions
    .map(
      (v, i) =>
        `<div class="pill" style="animation:${enter("in-up", start + 750 + i * 120, 800)}">${icon(v.icon, 34, brand.accent)}<span class="t">${v.label} <b>v${escapeHtml(v.version)}</b></span></div>`,
    )
    .join("")
  return section(
    slot,
    `
<div class="center">
  <div style="animation:${enter("pop", start + 100, 900)}">${foloLogo(150)}</div>
  <h1 class="headline" style="font-size:104px;margin-top:44px"><span class="line" style="animation:${enter("in-up", start + 380, 900)}"><span class="t">Folo update <em>time.</em></span></span></h1>
  <div class="pills" style="margin-top:40px">${pills}</div>
</div>`,
  )
}

const outro = (slot: Slot) => {
  const { start } = slot
  const line = versions.map((v) => `${v.label} v${escapeHtml(v.version)}`).join(" · ")
  return section(
    slot,
    `
<div class="center">
  <div style="animation:${enter("pop", start + 100, 900)}">${foloLogo(140)}</div>
  <h1 class="headline" style="font-size:112px;margin-top:40px"><span class="line" style="animation:${enter("in-up", start + 350, 900)}"><span class="t">Update <em>today.</em></span></span></h1>
  <p class="sub" style="font-size:40px;margin-top:22px;animation:${enter("in-up", start + 650, 900)}"><span class="t">folo.is</span></p>
  <p class="small" style="animation:${enter("in-up", start + 850, 900)}"><span class="t">${line}</span></p>
</div>`,
  )
}

const pageHtml = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="${googleFontsHref}">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden }
  body { font-family: "Geist", "Noto Sans SC", "Noto Sans TC", "Noto Sans JP", "Noto Sans KR", sans-serif; color: ${brand.ink}; background: ${brand.paper}; -webkit-font-smoothing: antialiased }
  .bg { position: absolute; inset: 0; overflow: hidden;
    background: radial-gradient(1100px 800px at 92% 4%, rgba(255,92,0,.16), transparent 70%),
                radial-gradient(900px 700px at 6% 10%, rgba(255,184,130,.20), transparent 70%),
                linear-gradient(180deg, ${brand.paper} 0%, ${brand.paperDeep} 100%) }
  .blob { position: absolute; border-radius: 50%; filter: blur(80px) }
  .scene { position: absolute; inset: 0 }
  .abs { position: absolute }
  .copy { position: absolute; left: 120px; top: 0; bottom: 0; width: 700px; display: flex; flex-direction: column; justify-content: center }
  .center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center }
  .eyebrow { display: flex; align-items: center; gap: 14px; color: ${brand.accent}; font-weight: 600; font-size: 32px; margin-bottom: 26px }
  .headline { font-weight: 760; line-height: 1.04; letter-spacing: -0.03em }
  .headline .line { display: block }
  .headline em { font-style: normal; background: linear-gradient(92deg, ${brand.accent} 0%, ${brand.accentSoft} 100%); -webkit-background-clip: text; background-clip: text; color: transparent }
  .sub { margin-top: 30px; font-size: 32px; line-height: 1.42; color: ${brand.inkSecondary}; max-width: 640px }
  .sub em { font-style: normal; color: ${brand.accent} }
  .small { margin-top: 18px; font-size: 26px; color: ${brand.inkTertiary} }
  .pills { display: flex; gap: 22px }
  .pill { display: flex; align-items: center; gap: 14px; padding: 18px 30px; border-radius: 999px; background: rgba(255,255,255,.75); box-shadow: 0 10px 30px rgba(76,36,10,.10), inset 0 0 0 1px rgba(255,92,0,.14); font-size: 34px; color: ${brand.inkSecondary} }
  .pill b { color: ${brand.ink}; font-weight: 700 }
  .chips { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 34px }
  .chip { padding: 12px 24px; border-radius: 999px; font-size: 30px; font-weight: 600; background: rgba(255,255,255,.7); color: ${brand.inkSecondary}; box-shadow: inset 0 0 0 1px rgba(27,21,18,.08) }
  .items { list-style: none; margin-top: 36px; display: flex; flex-direction: column; gap: 16px }
  .items li { display: flex; align-items: center; gap: 16px; font-size: 30px; color: ${brand.inkSecondary} }
  .items em { font-style: normal; color: ${brand.ink} }
  .badge { width: 112px; height: 112px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, ${brand.accent}, ${brand.accentSoft}); box-shadow: 0 18px 40px rgba(255,92,0,.35), 0 0 0 10px rgba(255,255,255,.7) }
  .callout { border-radius: 26px; box-shadow: 0 30px 60px -10px rgba(76,36,10,.35), 0 0 0 1px rgba(0,0,0,.06) }

  @keyframes show { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fade-in { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fade-out { from { opacity: 1 } to { opacity: 0; transform: translateY(-24px) } }
  @keyframes in-up { from { opacity: 0; transform: translateY(46px) } to { opacity: 1; transform: none } }
  @keyframes in-right { from { opacity: 0; transform: translateX(160px) } to { opacity: 1; transform: none } }
  @keyframes pop { 0% { opacity: 0; transform: scale(.6) } 60% { opacity: 1; transform: scale(1.05) } 100% { opacity: 1; transform: scale(1) } }
  @keyframes drift { from { transform: scale(1) } to { transform: scale(1.035) } }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes glow { 0%, 100% { box-shadow: 0 30px 60px -10px rgba(76,36,10,.35), 0 0 0 0 rgba(255,92,0,0) } 50% { box-shadow: 0 30px 60px -10px rgba(76,36,10,.35), 0 0 0 14px rgba(255,92,0,.22) } }
  @keyframes chip-on { to { background: ${brand.accent}; color: #fff; box-shadow: 0 10px 24px rgba(255,92,0,.3) } }
  @keyframes chip-off { to { background: rgba(255,255,255,.7); color: ${brand.inkSecondary}; box-shadow: inset 0 0 0 1px rgba(27,21,18,.08) } }
  @keyframes blob-a { from { transform: translate(0,0) } to { transform: translate(-260px, 160px) } }
  @keyframes blob-b { from { transform: translate(0,0) } to { transform: translate(220px, -120px) } }
</style></head>
<body>
  <div class="bg">
    <div class="blob" style="width:760px;height:760px;right:-160px;top:-260px;background:rgba(255,92,0,.20);animation:blob-a ${TOTAL}ms linear 0ms both"></div>
    <div class="blob" style="width:620px;height:620px;left:-200px;bottom:-240px;background:rgba(255,178,115,.28);animation:blob-b ${TOTAL}ms linear 0ms both"></div>
  </div>
  ${intro(slots[0]!)}
  ${spec.scenes.map((scene, i) => featureScene(scene, slots[i + 1]!)).join("\n")}
  ${outro(slots.at(-1)!)}
</body></html>`

// --- rendering ---------------------------------------------------------------

const seek = (pg: Page, ms: number) =>
  pg.evaluate(async (time) => {
    for (const animation of document.getAnimations()) animation.currentTime = time
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))
  }, ms)

// Text runs marked .t must stay on one line, .t-wrap may wrap; copy stays in its column
// and all text inside the safe area.
const findProblems = (pg: Page) =>
  pg.evaluate(
    ({ width, height, copyRight, safe }) => {
      const problems: string[] = []
      for (const el of document.querySelectorAll<HTMLElement>(".t, .t-wrap")) {
        const scene = el.closest<HTMLElement>(".scene")
        if (!scene || Number(getComputedStyle(scene).opacity) < 0.5) continue
        const range = document.createRange()
        range.selectNodeContents(el)
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0)
        if (rects.length === 0) continue
        const label = JSON.stringify((el.textContent ?? "").trim().slice(0, 48))
        // Fragments more than 8px apart vertically sit on different lines.
        const tops = rects.map((rect) => rect.top).sort((a, b) => a - b)
        const lines = 1 + tops.filter((t, i) => i > 0 && t - tops[i - 1]! > 8).length
        const left = Math.min(...rects.map((rect) => rect.left))
        const right = Math.max(...rects.map((rect) => rect.right))
        const top = Math.min(...rects.map((rect) => rect.top))
        const bottom = Math.max(...rects.map((rect) => rect.bottom))
        if (el.classList.contains("t") && lines > 1) problems.push(`${label} wraps`)
        if (el.closest(".copy") && right > copyRight)
          problems.push(`${label} leaves the copy column`)
        if (left < safe || top < safe || right > width - safe || bottom > height - safe) {
          problems.push(`${label} leaves the safe area`)
        }
      }
      return problems
    },
    { width: W, height: H, copyRight: COPY_RIGHT, safe: SAFE },
  )

// Every scene has settled half a second before it ends.
const stillAt = (slot: Slot) => slot.end - 500

const checkAll = async (pg: Page) => {
  const problems: string[] = []
  for (const slot of slots) {
    await seek(pg, stillAt(slot))
    problems.push(...(await findProblems(pg)).map((problem) => `${slot.name}: ${problem}`))
  }
  return problems
}

const contactSheet = async (paths: string[], out: string) => {
  const [thumbW, thumbH, gap, columns] = [640, 360, 16, 3]
  const rows = Math.ceil(paths.length / columns)
  const thumbs = await Promise.all(
    paths.map((path) => sharp(path).resize(thumbW, thumbH).png().toBuffer()),
  )
  await sharp({
    create: {
      width: columns * thumbW + (columns + 1) * gap,
      height: rows * thumbH + (rows + 1) * gap,
      channels: 3,
      background: "#e9e2dc",
    },
  })
    .composite(
      thumbs.map((input, i) => ({
        input,
        left: gap + (i % columns) * (thumbW + gap),
        top: gap + Math.floor(i / columns) * (thumbH + gap),
      })),
    )
    .png()
    .toFile(out)
}

const encoder = (out: string) => {
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "16",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      out,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  )
  const done = new Promise<void>((finish, reject) => {
    ffmpeg.once("error", reject)
    ffmpeg.once("close", (code) =>
      code === 0 ? finish() : reject(new Error(`ffmpeg exited with ${code}`)),
    )
  })
  // A failed encoder rejects `done`; the broken pipe it leaves needs no second report.
  done.catch(() => {})
  ffmpeg.stdin.on("error", () => {})
  return {
    write: async (frame: Buffer) => {
      if (!ffmpeg.stdin.write(frame)) await Promise.race([once(ffmpeg.stdin, "drain"), done])
    },
    end: async () => {
      ffmpeg.stdin.end()
      await done
    },
  }
}

console.log(
  `Timeline (${TOTAL / 1000} s): ${slots.map((slot) => `${slot.name} ${slot.start / 1000}–${slot.end / 1000}`).join(", ")}`,
)
for (const [ref, capture] of shots) {
  console.log(
    `  ${ref.padEnd(28)} ${capture.width}×${capture.height}  captured ${localTime(capture.takenAt)}`,
  )
}
if (videoPath && spawnSync("ffmpeg", ["-version"]).error) {
  throw new Error("ffmpeg is missing (brew install ffmpeg)")
}

const workDir = await mkdtemp(join(tmpdir(), "folo-release-video-"))
const browser = await chromium.launch()
try {
  const pg = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  // A file:// document can load file:// captures, which setContent() cannot.
  const file = join(workDir, "index.html")
  await writeFile(file, pageHtml)
  await pg.goto(pathToFileURL(file).href, { waitUntil: "networkidle" })
  await pg.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((img) => img.decode().catch(() => undefined)))
    // Headlines shrink until each of their lines fits on one line of the copy column.
    for (const headline of document.querySelectorAll<HTMLElement>(".copy .headline")) {
      // No named helpers in here: tsx wraps them in a __name() call the page lacks.
      let size = Number.parseFloat(headline.style.fontSize)
      while (
        size > 64 &&
        [...headline.querySelectorAll(".t")].some((line) => line.getClientRects().length > 1)
      ) {
        size -= 2
        headline.style.fontSize = `${size}px`
      }
    }
    for (const animation of document.getAnimations()) animation.pause()
  })

  const problems = await checkAll(pg)
  for (const problem of problems) console.warn(`PROBLEM ${problem}`)

  if (stillsDir) {
    await mkdir(stillsDir, { recursive: true })
    const paths: string[] = []
    for (const [i, slot] of slots.entries()) {
      await seek(pg, stillAt(slot))
      const path = join(stillsDir, `${String(i).padStart(2, "0")}-${slot.name}.png`)
      await pg.screenshot({ path })
      paths.push(path)
    }
    await contactSheet(paths, join(stillsDir, "contact-sheet.png"))
    console.log(`Wrote ${paths.length} stills and contact-sheet.png to ${stillsDir}`)
  }

  if (videoPath && problems.length > 0) {
    console.error("Not rendering the video until the problems above are fixed")
  } else if (videoPath) {
    await mkdir(join(resolve(videoPath), ".."), { recursive: true })
    const video = encoder(videoPath)
    const frames = Math.round((TOTAL / 1000) * FPS)
    for (let i = 0; i < frames; i++) {
      await seek(pg, (i * 1000) / FPS)
      await video.write(await pg.screenshot({ type: "png" }))
      if (i % 150 === 0) console.log(`frame ${i}/${frames}`)
    }
    await video.end()
    console.log(`Wrote ${videoPath} (${frames} frames, ${TOTAL / 1000} s)`)
  }
  process.exitCode = problems.length > 0 ? 1 : 0
} finally {
  await browser.close()
  await rm(workDir, { recursive: true, force: true })
}
