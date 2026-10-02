// Microsoft Store artwork that does not depend on a locale: the 16:9 super
// hero art and the 300 x 300 store logo. The Store overlays the product title
// on the hero art's lower left, so the art carries no text or app UI and keeps
// that corner quiet.
import { brand } from "./brand"
import { foloGlyph, icon } from "./icons"
import { grain } from "./slide"

// View colors match the app's view pills.
const views = {
  articles: { icon: "paper-fill", color: brand.accent },
  social: { icon: "twitter-fill", color: "#0EA5E9" },
  pictures: { icon: "pic-fill", color: "#22C55E" },
  videos: { icon: "video-fill", color: "#EF4444" },
  audios: { icon: "mic-fill", color: "#A855F7" },
} as const

type View = keyof typeof views

const badge = (view: View, size: number) =>
  `<div class="badge" style="width:${size}px;height:${size}px;border-radius:${size * 0.3}px;background:${views[view].color}">${icon(views[view].icon, size * 0.58, "#fff")}</div>`

const bars = (widths: number[]) =>
  `<div class="bars">${widths.map((w, i) => `<i style="width:${w}%;opacity:${i === 0 ? 0.62 : 0.26}"></i>`).join("")}</div>`

interface Card {
  view: View
  left: number
  top: number
  width: number
  rotate: number
  body: string
}

const cards: Card[] = [
  {
    view: "articles",
    left: 1640,
    top: 300,
    width: 800,
    rotate: -4,
    body: `<div class="row">${badge("articles", 104)}${bars([78, 96, 62])}</div>`,
  },
  {
    view: "social",
    left: 3060,
    top: 230,
    width: 640,
    rotate: 5,
    body: `<div class="row">${badge("social", 96)}${bars([64, 92])}</div>`,
  },
  {
    view: "pictures",
    left: 3160,
    top: 860,
    width: 560,
    rotate: 3,
    body: `<div class="photo"><div class="sun"></div><div class="ridge back"></div><div class="ridge"></div></div><div class="row compact">${badge("pictures", 80)}${bars([70])}</div>`,
  },
  {
    view: "videos",
    left: 1600,
    top: 1160,
    width: 640,
    rotate: -3,
    body: `<div class="video"><div class="play"></div></div><div class="row compact">${badge("videos", 80)}${bars([82])}</div>`,
  },
  {
    view: "audios",
    left: 2560,
    top: 1580,
    width: 620,
    rotate: -2,
    body: `<div class="row">${badge("audios", 96)}<div class="wave">${[
      0.35, 0.7, 0.5, 0.95, 0.6, 0.4, 0.85, 0.55, 0.3, 0.75, 0.5, 0.9, 0.45, 0.65, 0.35,
    ]
      .map((h) => `<i style="height:${Math.round(h * 100)}%"></i>`)
      .join("")}</div></div>`,
  },
]

export const superHeroArt = { width: 3840, height: 2160 } as const

export const renderSuperHeroArtHtml = () => {
  const { width: W, height: H } = superHeroArt
  const logo = { x: 2600, y: 900, size: 640 }
  const rings = [560, 820, 1100, 1400, 1720]
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    position: relative;
    background:
      radial-gradient(1500px 1200px at ${(logo.x / W) * 100}% ${(logo.y / H) * 100}%, rgba(255,92,0,.5), transparent 70%),
      radial-gradient(1100px 900px at 96% 100%, rgba(255,138,61,.22), transparent 70%),
      radial-gradient(900px 700px at 0% 0%, rgba(255,178,115,.1), transparent 70%),
      linear-gradient(135deg, #221914 0%, #140f0c 100%);
  }
  .grain { position: absolute; inset: 0; background-image: ${grain}; opacity: .12; mix-blend-mode: screen; }
  .ring { position: absolute; border-radius: 50%; border: 3px solid rgba(255,150,90,1); }
  .logo {
    position: absolute; display: grid; place-items: center;
    width: ${logo.size}px; height: ${logo.size}px; left: ${logo.x - logo.size / 2}px; top: ${logo.y - logo.size / 2}px;
    border-radius: ${logo.size * 0.224}px;
    background: linear-gradient(145deg, ${brand.accentSoft} 0%, ${brand.accent} 48%, #E24E00 100%);
    box-shadow: 0 80px 200px rgba(255,92,0,.55), 0 40px 90px rgba(0,0,0,.45), inset 0 5px 0 rgba(255,255,255,.3);
  }
  .card {
    position: absolute; padding: 40px; border-radius: 48px;
    background: linear-gradient(160deg, rgba(255,255,255,.15), rgba(255,255,255,.05));
    border: 2px solid rgba(255,255,255,.14);
    box-shadow: 0 50px 100px rgba(0,0,0,.38);
    backdrop-filter: blur(36px);
  }
  .row { display: flex; align-items: center; gap: 36px; }
  .row.compact { margin-top: 32px; gap: 28px; }
  .badge { display: grid; place-items: center; flex: none; box-shadow: 0 12px 30px rgba(0,0,0,.25); }
  .bars { flex: 1; display: flex; flex-direction: column; gap: 22px; }
  .bars i { display: block; height: 22px; border-radius: 11px; background: #fff; }
  .photo, .video { position: relative; height: 300px; border-radius: 30px; overflow: hidden; }
  .photo { background: linear-gradient(180deg, #FFD3A8 0%, #FF9A52 55%, #F26A1B 100%); }
  .sun { position: absolute; width: 120px; height: 120px; border-radius: 50%; left: 330px; top: 60px; background: #FFF4E6; box-shadow: 0 0 80px rgba(255,244,230,.9); }
  .ridge { position: absolute; inset: 0; background: #8A3A12; clip-path: polygon(0 78%, 22% 52%, 40% 70%, 62% 40%, 100% 74%, 100% 100%, 0 100%); }
  .ridge.back { background: #C4541B; opacity: .8; clip-path: polygon(0 62%, 18% 44%, 36% 58%, 55% 30%, 78% 50%, 100% 36%, 100% 100%, 0 100%); }
  .video { background: linear-gradient(135deg, #3B1C10 0%, #7A2A0C 55%, #C2410C 100%); display: grid; place-items: center; }
  .play { width: 130px; height: 130px; border-radius: 50%; background: rgba(255,255,255,.9); position: relative; }
  .play::after { content: ""; position: absolute; left: 52px; top: 38px; border-left: 44px solid #C2410C; border-top: 27px solid transparent; border-bottom: 27px solid transparent; }
  .wave { flex: 1; height: 96px; display: flex; align-items: center; gap: 12px; }
  .wave i { flex: 1; border-radius: 8px; background: rgba(255,255,255,.55); }
</style>
</head>
<body>
${rings
  .map(
    (r, i) =>
      `<div class="ring" style="width:${r * 2}px;height:${r * 2}px;left:${logo.x - r}px;top:${logo.y - r}px;opacity:${[0.3, 0.22, 0.15, 0.1, 0.06][i]}"></div>`,
  )
  .join("")}
<div class="logo">${foloGlyph(logo.size)}</div>
${cards
  .map(
    (c) =>
      `<div class="card" style="left:${c.left}px;top:${c.top}px;width:${c.width}px;transform:rotate(${c.rotate}deg)">${c.body}</div>`,
  )
  .join("")}
<div class="grain"></div>
<script>document.body.dataset.ready = "1"</script>
</body>
</html>`
}

// Full-bleed mark; the Store rounds tile corners itself.
export const renderStoreLogoHtml = (size = 300) => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; }
  html, body { width: ${size}px; height: ${size}px; overflow: hidden; }
  body { display: grid; place-items: center; background: ${brand.accent}; }
</style>
</head>
<body>
${foloGlyph(size)}
<script>document.body.dataset.ready = "1"</script>
</body>
</html>`
