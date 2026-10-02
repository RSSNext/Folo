// Checks the rendered store images: every deck has one file per slide for
// every store locale, at the store size and without an alpha channel.
//   tsx store-assets/scripts/check-output.ts
import { readdir } from "node:fs/promises"

import { join } from "pathe"
import sharp from "sharp"

import { decks } from "../src/decks"
import { listingLocales } from "../src/locales"

const root = join(import.meta.dirname, "..", "output")
const problems: string[] = []
let files = 0

const check = async (path: string, width: number, height: number) => {
  const meta = await sharp(path)
    .metadata()
    .catch(() => null)
  if (!meta) {
    problems.push(`${path}: missing`)
    return
  }
  files++
  if (meta.width !== width || meta.height !== height || meta.hasAlpha) {
    problems.push(`${path}: ${meta.width}x${meta.height}${meta.hasAlpha ? " with alpha" : ""}`)
  }
}

for (const deck of decks) {
  const { width, height } = deck.outputs[0]!
  for (const locale of listingLocales) {
    const storeLocales =
      deck.store === "app-store"
        ? locale.appStore
        : deck.store === "google-play"
          ? locale.googlePlay
          : locale.microsoftStore
    for (const storeLocale of storeLocales) {
      const dir = join(root, deck.id, storeLocale)
      const list = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".png"))
      if (list.length !== deck.slides.length) {
        problems.push(`${deck.id}/${storeLocale}: ${list.length} of ${deck.slides.length} slides`)
      }
      for (const file of list) await check(join(dir, file), width, height)
    }
  }
}

for (const locale of listingLocales) {
  for (const storeLocale of locale.googlePlay) {
    await check(
      join(root, "google-play/feature-graphic", storeLocale, "feature-graphic.png"),
      1024,
      500,
    )
  }
}
await check(join(root, "microsoft-store/extras/super-hero-art.png"), 3840, 2160)
await check(join(root, "microsoft-store/extras/store-logo-300.png"), 300, 300)

for (const problem of problems) console.log(problem)
console.log(`${files} images checked, ${problems.length} problems`)
process.exitCode = problems.length > 0 ? 1 : 0
