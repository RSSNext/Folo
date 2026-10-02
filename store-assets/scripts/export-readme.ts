// Exports the images the repository README shows: the banner plus English Mac
// and iPhone posters, as JPEGs to upload as GitHub attachments (the README
// links them, so they stay out of the repository). Run render.ts for
// `github/readme`, `app-store/mac` and `app-store/iphone` first.
//   tsx store-assets/scripts/export-readme.ts
// Output: store-assets/output/github/readme/*.jpg
import { mkdir, rm } from "node:fs/promises"

import { join } from "pathe"
import sharp from "sharp"

const output = join(import.meta.dirname, "..", "output")
const target = join(output, "github", "readme")

// Widths are about twice the size GitHub shows them at, for high-density screens.
const images = [
  { from: "github/readme-banner.png", to: "banner.jpg", width: 2400 },
  { from: "app-store/mac/en-US/02-chat.png", to: "ai-chat.jpg", width: 1920 },
  { from: "app-store/mac/en-US/03-digest.png", to: "timeline-summary.jpg", width: 1920 },
  { from: "app-store/mac/en-US/04-translate.png", to: "translation.jpg", width: 1920 },
  { from: "app-store/mac/en-US/05-formats.png", to: "formats.jpg", width: 1920 },
  { from: "app-store/mac/en-US/06-tasks.png", to: "ai-tasks.jpg", width: 1920 },
  { from: "app-store/mac/en-US/07-integrations.png", to: "integrations.jpg", width: 1920 },
  { from: "app-store/iphone/en-US/02-summary.png", to: "mobile-summary.jpg", width: 600 },
  { from: "app-store/iphone/en-US/05-listen.png", to: "mobile-listen.jpg", width: 600 },
  { from: "app-store/iphone/en-US/06-discover.png", to: "mobile-discover.jpg", width: 600 },
  { from: "app-store/iphone/en-US/07-sync.png", to: "mobile-sync.jpg", width: 600 },
]

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })
for (const image of images) {
  const info = await sharp(join(output, image.from))
    .resize({ width: image.width })
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(join(target, image.to))
  console.log(`${image.to} ${info.width}x${info.height} ${Math.round(info.size / 1024)} KB`)
}
