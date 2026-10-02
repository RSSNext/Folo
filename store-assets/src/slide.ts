import type { Tone } from "./brand"
import { brand, fontStackFor, googleFontsHref, isCjkLocale } from "./brand"
import type { Capture, DeviceKind, FrameResult } from "./frames"
import { handheldFrame, macWindow, windowsWindow } from "./frames"
import { foloLogo, icon } from "./icons"

export interface SlideCopy {
  eyebrow?: string
  // `*text*` marks the emphasized phrase; `\n` is an intentional line break.
  headline: string
  sub?: string
  pills?: string[]
  badge?: string
}

export type Layout =
  | "hero"
  | "device-bottom"
  | "device-top"
  | "two-devices"
  | "sync"
  | "closer"
  | "split"
  | "split-right"
  | "banner"

// A crop of a capture shown as a floating card over the device, e.g. the AI
// summary block. Rect values are fractions of the capture size.
export interface Callout {
  capture: Capture
  rect: [x: number, y: number, w: number, h: number]
  // Card position and width as fractions of the canvas.
  at: [x: number, y: number]
  width: number
  rotate?: number
}

export interface SlideInput {
  canvas: { width: number; height: number }
  locale: string
  layout: Layout
  tone: Tone
  device: DeviceKind
  captures: [Capture, ...Capture[]]
  copy: SlideCopy
  eyebrowIcon?: string
  callouts?: Callout[]
  // Second device for the sync and banner layouts, e.g. a Mac window behind
  // the phone.
  companion?: { device: DeviceKind; capture: Capture }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")

const renderHeadline = (headline: string) =>
  headline
    .split("\n")
    .map((line) =>
      escapeHtml(line).replaceAll(/\*([^*]+)\*/g, (_, phrase: string) => `<em>${phrase}</em>`),
    )
    .map((line) => `<span class="line">${line}</span>`)
    .join("")

const background = (tone: Tone, w: number, h: number) => {
  const s = Math.max(w, h)
  if (tone === "dark") {
    return [
      `radial-gradient(${s * 0.55}px ${s * 0.45}px at 82% 12%, rgba(255,92,0,.42), transparent 70%)`,
      `radial-gradient(${s * 0.5}px ${s * 0.4}px at 8% 92%, rgba(255,138,61,.22), transparent 70%)`,
      `linear-gradient(180deg, #1d1612 0%, ${brand.night} 100%)`,
    ].join(",")
  }
  return [
    `radial-gradient(${s * 0.55}px ${s * 0.4}px at 92% 4%, rgba(255,92,0,.18), transparent 70%)`,
    `radial-gradient(${s * 0.45}px ${s * 0.35}px at 6% 10%, rgba(255,184,130,.2), transparent 70%)`,
    `radial-gradient(${s * 0.5}px ${s * 0.42}px at 2% 98%, rgba(255,150,70,.18), transparent 70%)`,
    `radial-gradient(${s * 0.4}px ${s * 0.32}px at 50% 58%, rgba(255,226,204,.5), transparent 70%)`,
    `linear-gradient(180deg, ${brand.paper} 0%, ${brand.paperDeep} 100%)`,
  ].join(",")
}

// Film-grain overlay keeps large gradients from banding after PNG/JPEG export.
export const grain = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
)}")`

const frame = (device: DeviceKind, capture: Capture, width: number, tone: Tone): FrameResult => {
  switch (device) {
    case "mac": {
      return macWindow(capture, width, tone)
    }
    case "windows": {
      return windowsWindow(capture, width, tone)
    }
    default: {
      return handheldFrame(device, capture, width, tone)
    }
  }
}

const place = (html: string, left: number, top: number, extra = "", attrs = "") =>
  `<div${attrs ? ` ${attrs}` : ""} style="position:absolute;left:${left}px;top:${top}px;${extra}">${html}</div>`

const calloutCard = (c: Callout, canvasW: number, canvasH: number, tone: Tone) => {
  const [rx, ry, rw, rh] = c.rect
  const width = c.width * canvasW
  const scale = width / (rw * c.capture.width)
  const height = rh * c.capture.height * scale
  const radius = width * 0.045
  const img = `<div style="position:relative;width:${width}px;height:${height}px;border-radius:${radius}px;overflow:hidden;background:#fff;box-shadow:0 ${width * 0.06}px ${width * 0.12}px -${width * 0.02}px rgba(76,36,10,${tone === "dark" ? ".6" : ".3"}),0 0 0 ${Math.max(1, width * 0.002)}px rgba(0,0,0,.06)">
    <img src="${c.capture.url}" style="position:absolute;left:${-rx * c.capture.width * scale}px;top:${-ry * c.capture.height * scale}px;width:${c.capture.width * scale}px;height:${c.capture.height * scale}px" />
  </div>`
  return place(
    img,
    c.at[0] * canvasW,
    c.at[1] * canvasH,
    `transform:rotate(${c.rotate ?? 0}deg);z-index:5`,
  )
}

interface TextMetrics {
  eyebrow: number
  headline: number
  sub: number
  maxWidth: number
}

const textBlock = (input: SlideInput, metrics: TextMetrics, align: "left" | "center") => {
  const { copy, tone } = input
  const eyebrow = copy.eyebrow
    ? `<div class="eyebrow">${input.eyebrowIcon ? icon(input.eyebrowIcon, metrics.eyebrow * 1.1, brand.accent) : ""}<span>${escapeHtml(copy.eyebrow)}</span></div>`
    : ""
  const sub = copy.sub ? `<p class="sub">${escapeHtml(copy.sub)}</p>` : ""
  const badge = copy.badge
    ? `<div class="badge">${icon("github-fill", metrics.eyebrow * 1.05, tone === "dark" ? brand.nightText : brand.ink)}<span>${escapeHtml(copy.badge)}</span></div>`
    : ""
  return `<div class="text" style="text-align:${align};align-items:${align === "center" ? "center" : "flex-start"};max-width:${metrics.maxWidth}px">${eyebrow}<h1 class="headline">${renderHeadline(copy.headline)}</h1>${sub}${badge}</div>`
}

const pillsBlock = (pills: string[], size: number, tone: Tone, align: "left" | "center") =>
  `<div class="pills" style="justify-content:${align === "center" ? "center" : "flex-start"};gap:${size * 0.5}px">${pills
    .map(
      (pill, i) =>
        `<span class="pill${i % 3 === 0 ? " pill-accent" : ""}" style="font-size:${size}px;padding:${size * 0.42}px ${size * 0.85}px;border-radius:${size * 2}px">${escapeHtml(pill)}</span>`,
    )
    .join("")}</div>${tone === "dark" ? "" : ""}`

const layoutBody = (input: SlideInput): string => {
  const { canvas, layout, tone, device, captures } = input
  const W = canvas.width
  const H = canvas.height
  const portrait = H > W
  const cjk = isCjkLocale(input.locale)

  if (!portrait) {
    return landscapeBody(input)
  }

  const pad = W * 0.075
  const metrics: TextMetrics = {
    eyebrow: W * 0.034,
    headline: W * (cjk ? 0.092 : 0.1),
    sub: W * 0.036,
    maxWidth: W - pad * 2,
  }
  const textTop = H * 0.075
  const tablet = device === "ipad" || device === "android-tablet"

  const centered = (html: string, top: number) =>
    place(html, pad, top, `width:${W - pad * 2}px;display:flex;justify-content:center`)

  switch (layout) {
    case "hero":
    case "device-bottom": {
      // Headline on top; the device bleeds off the bottom edge.
      const deviceW = W * (tablet ? 0.8 : layout === "hero" ? 0.8 : 0.84)
      const f = frame(device, captures[0], deviceW, tone)
      const deviceTop = H * (layout === "hero" ? 0.335 : 0.3)
      return `${centered(textBlock(input, metrics, "center"), textTop)}
${place(f.html, (W - f.width) / 2, deviceTop)}`
    }
    case "device-top": {
      // The whole device sits above the caption. On a canvas too short for
      // both, such as Google Play's 9:16, the page script shrinks the device
      // so the caption stays above the bottom margin.
      const deviceW = W * 0.7
      const f = frame(device, captures[0], deviceW, tone)
      const deviceTop = H * 0.045
      const gap = H * 0.035
      const captionTop = deviceTop + f.height + gap
      return `${place(f.html, (W - f.width) / 2, deviceTop, "transform-origin:top center", 'data-fit="device"')}
${place(
  textBlock(input, metrics, "center"),
  pad,
  captionTop,
  `width:${W - pad * 2}px;display:flex;justify-content:center`,
  `data-fit="caption" data-gap="${gap}" data-margin="${H * 0.05}"`,
)}`
    }
    case "two-devices": {
      const deviceW = W * (tablet ? 0.6 : 0.62)
      const back = frame(device, captures[1] ?? captures[0], deviceW, tone)
      const front = frame(device, captures[0], deviceW, tone)
      return `${centered(textBlock(input, metrics, "center"), textTop)}
${place(back.html, W * 0.47, H * 0.35, "transform:rotate(5deg);transform-origin:top left")}
${place(front.html, W * -0.03, H * 0.33, "transform:rotate(-4deg);transform-origin:top left")}`
    }
    case "sync": {
      // A desktop window behind the handheld shows the same timeline on both.
      if (!input.companion) throw new Error("sync layout needs a companion device")
      const desk = frame(input.companion.device, input.companion.capture, W * 1.08, tone)
      const deviceW = W * (tablet ? 0.46 : 0.5)
      const f = frame(device, captures[0], deviceW, tone)
      return `${centered(textBlock(input, metrics, "center"), textTop)}
${place(desk.html, W * 0.1, H * 0.37)}
${place(f.html, W * 0.06, H * 0.43)}`
    }
    case "closer": {
      const deviceW = W * (tablet ? 0.62 : 0.66)
      const f = frame(device, captures[0], deviceW, tone)
      const pills = input.copy.pills ?? []
      return `${centered(textBlock(input, metrics, "center"), textTop)}
${place(pillsBlock(pills, W * 0.034, tone, "center"), pad, H * 0.29, `width:${W - pad * 2}px`)}
${place(f.html, (W - f.width) / 2, H * 0.52)}`
    }
    default: {
      throw new Error(`Layout ${layout} is not available on portrait canvases`)
    }
  }
}

// Type scale unit: the canvas width on portrait canvases, a multiple of the
// height on landscape ones. The README banner is wider than the store canvases
// and shown smaller, so its copy gets a larger unit.
const textUnit = (canvas: SlideInput["canvas"], layout: Layout) =>
  canvas.height > canvas.width ? canvas.width : canvas.height * (layout === "banner" ? 1.7 : 1.35)

const landscapeBody = (input: SlideInput): string => {
  const { canvas, layout, tone, device, captures } = input
  const W = canvas.width
  const H = canvas.height
  const cjk = isCjkLocale(input.locale)

  const metrics: TextMetrics = {
    eyebrow: H * 0.028,
    headline: H * (cjk ? 0.066 : 0.074),
    sub: H * 0.03,
    maxWidth: W * 0.3,
  }

  switch (layout) {
    case "split": {
      const f = frame(device, captures[0], W * 0.67, tone)
      return `${place(textBlock(input, metrics, "left"), W * 0.05, H * 0.5, "transform:translateY(-50%)")}
${place(f.html, W * 0.355, (H - f.height) / 2)}`
    }
    case "split-right": {
      const f = frame(device, captures[0], W * 0.67, tone)
      return `${place(f.html, W * -0.025, (H - f.height) / 2)}
${place(textBlock(input, metrics, "left"), W * 0.67, H * 0.5, "transform:translateY(-50%)")}`
    }
    case "hero":
    case "device-bottom": {
      const textMetrics = { ...metrics, maxWidth: W * 0.8 }
      const f = frame(device, captures[0], W * 0.74, tone)
      return `${place(textBlock(input, textMetrics, "center"), W * 0.1, H * 0.07, `width:${W * 0.8}px;display:flex;justify-content:center`)}
${place(f.html, (W - f.width) / 2, H * 0.31)}`
    }
    case "two-devices": {
      const back = frame(device, captures[1] ?? captures[0], W * 0.5, tone)
      const front = frame(device, captures[0], W * 0.5, tone)
      return `${place(textBlock(input, metrics, "left"), W * 0.055, H * 0.5, "transform:translateY(-50%)")}
${place(back.html, W * 0.47, H * 0.1)}
${place(front.html, W * 0.36, H * 0.36)}`
    }
    case "closer": {
      const textMetrics = { ...metrics, maxWidth: W * 0.8 }
      const f = frame(device, captures[0], W * 0.52, tone)
      const pills = input.copy.pills ?? []
      // A wide canvas fits the headline on one line, and the column keeps the
      // pills below it however the headline wraps.
      const oneLine = {
        ...input,
        copy: { ...input.copy, headline: input.copy.headline.replaceAll("\n", cjk ? "" : " ") },
      }
      return `<div style="position:absolute;left:${W * 0.1}px;top:${H * 0.07}px;width:${W * 0.8}px;display:flex;flex-direction:column;align-items:center;gap:${H * 0.035}px">
${textBlock(oneLine, textMetrics, "center")}
${pillsBlock(pills, H * 0.024, tone, "center")}
</div>
${place(f.html, (W - f.width) / 2, H * 0.43)}`
    }
    case "banner": {
      // GitHub README banner: the copy on the left, the desktop window on the
      // right and the phone in front of the window's sidebar.
      if (!input.companion) throw new Error("banner layout needs a companion device")
      const desk = frame(device, captures[0], W * 0.55, tone)
      const phone = frame(input.companion.device, input.companion.capture, W * 0.135, tone)
      const deskTop = (H - desk.height) / 2
      const bannerMetrics = { ...metrics, eyebrow: textUnit(canvas, layout) * 0.021 }
      return `${place(textBlock(input, bannerMetrics, "left"), W * 0.055, H * 0.5, "transform:translateY(-50%)")}
${place(desk.html, W * 0.42, deskTop)}
${place(phone.html, W * 0.375, deskTop + desk.height - phone.height * 0.82)}`
    }
    default: {
      throw new Error(`Layout ${layout} is not available on landscape canvases`)
    }
  }
}

// Korean wraps between words, Japanese between phrases; Chinese may wrap
// anywhere but must not start a line with closing punctuation.
const lineBreaking = (locale: string) => {
  if (locale === "ko") return "word-break: keep-all;"
  if (locale === "ja") return "word-break: auto-phrase; line-break: strict;"
  if (locale.startsWith("zh")) return "line-break: strict;"
  return "text-wrap: pretty;"
}

export const renderSlideHtml = (input: SlideInput) => {
  const { canvas, tone, locale } = input
  const W = canvas.width
  const H = canvas.height
  const portrait = H > W
  const cjk = isCjkLocale(locale)
  const unit = textUnit(canvas, input.layout)
  const headlineSize = unit * (portrait ? (cjk ? 0.092 : 0.1) : cjk ? 0.049 : 0.055)
  const fg = tone === "dark" ? brand.nightText : brand.ink
  const fgSecondary = tone === "dark" ? brand.nightTextSecondary : brand.inkSecondary
  const callouts = (input.callouts ?? []).map((c) => calloutCard(c, W, H, tone)).join("")

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="${googleFontsHref}" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    position: relative;
    font-family: ${fontStackFor(locale)};
    color: ${fg};
    background: ${background(tone, W, H)};
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "ss01", "cv11";
  }
  .grain {
    position: absolute; inset: 0; pointer-events: none;
    background-image: ${grain}; opacity: ${tone === "dark" ? 0.12 : 0.05}; mix-blend-mode: ${tone === "dark" ? "screen" : "multiply"};
  }
  .text { display: flex; flex-direction: column; gap: ${unit * 0.022}px; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: ${unit * 0.012}px;
    font-size: ${unit * (portrait ? 0.034 : 0.021)}px; font-weight: 600; letter-spacing: ${cjk ? "0.02em" : "-0.005em"};
    color: ${brand.accent};
  }
  .headline {
    font-size: ${headlineSize}px; font-weight: ${cjk ? 800 : 680}; line-height: ${cjk ? 1.2 : 1.03};
    letter-spacing: ${cjk ? "0.01em" : "-0.038em"}; display: flex; flex-direction: column;
  }
  .headline .line { display: block; white-space: nowrap; }
  .headline em {
    font-style: normal;
    background: linear-gradient(95deg, ${brand.accent} 0%, ${brand.accentSoft} 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    padding-bottom: 0.08em;
  }
  .sub { font-size: ${unit * (portrait ? 0.036 : 0.021)}px; line-height: 1.38; color: ${fgSecondary}; font-weight: 420; letter-spacing: ${cjk ? "0.02em" : "-0.01em"}; ${lineBreaking(locale)} }
  .badge {
    display: inline-flex; align-items: center; gap: ${unit * 0.01}px; margin-top: ${unit * 0.01}px;
    font-size: ${unit * (portrait ? 0.03 : 0.0135)}px; font-weight: 560; color: ${fg}; white-space: nowrap;
    padding: ${unit * (portrait ? 0.012 : 0.0075)}px ${unit * (portrait ? 0.024 : 0.015)}px; border-radius: 999px;
    background: ${tone === "dark" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.7)"};
    box-shadow: 0 0 0 1px ${tone === "dark" ? "rgba(255,255,255,.12)" : "rgba(27,21,18,.08)"};
  }
  .pills { display: flex; flex-wrap: wrap; }
  .pill {
    font-weight: 560; color: ${fg}; white-space: nowrap;
    background: ${tone === "dark" ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.72)"};
    box-shadow: 0 0 0 1px ${tone === "dark" ? "rgba(255,255,255,.12)" : "rgba(27,21,18,.07)"};
  }
  .pill-accent { color: ${brand.accent}; background: ${tone === "dark" ? "rgba(255,92,0,.16)" : "rgba(255,92,0,.1)"}; box-shadow: 0 0 0 1px rgba(255,92,0,.22); }
</style>
</head>
<body>
<div class="grain"></div>
${layoutBody(input)}
${callouts}
<script>
  // Shrink the headline until its longest line fits; long German or Russian
  // compounds would otherwise overflow the text column.
  document.fonts.ready.then(() => {
    for (const h of document.querySelectorAll('.headline')) {
      const max = h.parentElement.getBoundingClientRect().width;
      let size = parseFloat(getComputedStyle(h).fontSize);
      const widest = () => Math.max(...[...h.querySelectorAll('.line')].map((l) => l.scrollWidth));
      while (widest() > max && size > 20) { size *= 0.97; h.style.fontSize = size + 'px'; }
    }
    // Keep a device-top caption on the canvas: shrink the device from its
    // top edge and move the caption up when it would run past the margin.
    const device = document.querySelector('[data-fit="device"]');
    const caption = document.querySelector('[data-fit="caption"]');
    if (device && caption) {
      const gap = parseFloat(caption.dataset.gap);
      const limit = innerHeight - parseFloat(caption.dataset.margin);
      const d = device.getBoundingClientRect();
      const c = caption.getBoundingClientRect();
      if (c.bottom > limit) {
        const k = (limit - c.height - gap - d.top) / d.height;
        device.style.transform = 'scale(' + k + ')';
        caption.style.top = d.top + d.height * k + gap + 'px';
      }
    }
    document.body.dataset.ready = '1';
  });
</script>
</body>
</html>`
}

// Google Play feature graphic (1024 x 500): brand lockup on the left, a phone
// peeking in from the right. Play forbids ranking or price claims here.
export const renderFeatureGraphicHtml = (input: {
  locale: string
  copy: SlideCopy
  capture: Capture
}) => {
  const W = 1024
  const H = 500
  const cjk = isCjkLocale(input.locale)
  const phone = handheldFrame("android-phone", input.capture, 420, "light")
  return `<!doctype html>
<html lang="${input.locale}">
<head>
<meta charset="utf-8" />
<link rel="stylesheet" href="${googleFontsHref}" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body { position: relative; font-family: ${fontStackFor(input.locale)}; color: ${brand.ink}; background: ${background("light", W, H)}; -webkit-font-smoothing: antialiased; }
  .lockup { position: absolute; left: 64px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 18px; max-width: 520px; }
  .brand { display: flex; align-items: center; gap: 16px; font-size: 54px; font-weight: 700; letter-spacing: -0.03em; }
  .headline { font-size: ${cjk ? 44 : 48}px; font-weight: ${cjk ? 800 : 680}; line-height: 1.08; letter-spacing: ${cjk ? "0.01em" : "-0.035em"}; display: flex; flex-direction: column; }
  .headline .line { white-space: nowrap; }
  .headline em { font-style: normal; background: linear-gradient(95deg, ${brand.accent}, ${brand.accentSoft}); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .sub { font-size: 22px; color: ${brand.inkSecondary}; font-weight: 450; }
</style>
</head>
<body>
<div class="lockup">
  <div class="brand">${foloLogo(64)}<span>Folo</span></div>
  <h1 class="headline">${renderHeadline(input.copy.headline)}</h1>
  ${input.copy.sub ? `<p class="sub">${escapeHtml(input.copy.sub)}</p>` : ""}
</div>
<div style="position:absolute;left:640px;top:70px;transform:rotate(-8deg);transform-origin:top left">${phone.html}</div>
<script>
  document.fonts.ready.then(() => {
    const h = document.querySelector('.headline');
    let size = parseFloat(getComputedStyle(h).fontSize);
    while (Math.max(...[...h.querySelectorAll('.line')].map((l) => l.scrollWidth)) > 560 && size > 20) { size *= 0.97; h.style.fontSize = size + 'px'; }
    document.body.dataset.ready = '1';
  });
</script>
</body>
</html>`
}
