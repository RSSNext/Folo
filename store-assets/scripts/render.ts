// Renders store screenshots from app captures and listing copy.
//   tsx store-assets/scripts/render.ts [--deck app-store/iphone,...] [--locale en,ja,...] [--allow-missing]
// Output: store-assets/output/<store>/<device>/<store locale>/NN-<slide>.png,
// plus the locale-independent Microsoft Store extras in output/microsoft-store/extras
// and the English GitHub README banner in output/github/readme-banner.png.
// --allow-missing skips slides whose captures are not taken yet (for previews).
import { access, copyFile, mkdir, rm } from "node:fs/promises"

import { join } from "pathe"
import sharp from "sharp"

import { closeBrowser, renderHtml } from "../src/browser"
import { readCallout } from "../src/callout"
import type { CaptureDevice, DeckSpec, SlideSpec } from "../src/decks"
import { decks } from "../src/decks"
import { renderStoreLogoHtml, renderSuperHeroArtHtml, superHeroArt } from "../src/extras"
import type { Capture } from "../src/frames"
import { loadListing } from "../src/listing"
import type { ListingLocale } from "../src/locales"
import { listingLocales } from "../src/locales"
import type { SlideCopy } from "../src/slide"
import { renderFeatureGraphicHtml, renderSlideHtml } from "../src/slide"

const root = join(import.meta.dirname, "..")
const capturesDir = join(root, "captures")
const outputDir = join(root, "output")
// 2:1 keeps the banner short at the top of the README.
const readmeBanner = { width: 2400, height: 1200 }

const arg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? null : process.argv[index + 1]!.split(",")
}
const deckFilter = arg("deck")
const localeFilter = arg("locale")
const allowMissing = process.argv.includes("--allow-missing")

class MissingCaptureError extends Error {}

const captureCache = new Map<string, Capture>()
const loadCapture = async (
  locale: string,
  device: CaptureDevice,
  shot: string,
): Promise<Capture> => {
  const path = join(capturesDir, locale, device, `${shot}.png`)
  const cached = captureCache.get(path)
  if (cached) return cached
  await access(path).catch(() => {
    throw new MissingCaptureError(`Missing capture ${path}`)
  })
  const { width, height } = await sharp(path).metadata()
  const capture = { url: `file://${path}`, width: width!, height: height! }
  captureCache.set(path, capture)
  return capture
}

const storeLocales = (deck: DeckSpec, locale: ListingLocale) => {
  switch (deck.store) {
    case "app-store": {
      return locale.appStore
    }
    case "google-play": {
      return locale.googlePlay
    }
    case "microsoft-store": {
      return locale.microsoftStore
    }
  }
}

const slideCopy = (slide: SlideSpec, copy: Record<string, SlideCopy>): SlideCopy => {
  const base = copy[slide.copy]
  if (!base) throw new Error(`Missing copy for ${slide.copy}`)
  const result = { ...base }
  for (const field of slide.omit ?? []) delete result[field]
  return result
}

// Each output folder is emptied the first time this run writes to it, so a
// deck that lost a slide does not leave the old file behind.
const cleaned = new Set<string>()
const prepareDir = async (path: string) => {
  if (!cleaned.has(path)) {
    cleaned.add(path)
    await rm(path, { recursive: true, force: true })
  }
  await mkdir(path, { recursive: true })
}

// Writes the first store locale, then copies it to aliases such as zh-HK.
const writeForLocales = async (
  dir: (storeLocale: string) => string,
  file: string,
  storeLocaleList: string[],
  render: (path: string) => Promise<void>,
) => {
  const [primary, ...aliases] = storeLocaleList
  await prepareDir(dir(primary!))
  const first = join(dir(primary!), file)
  await render(first)
  for (const alias of aliases) {
    await prepareDir(dir(alias))
    await copyFile(first, join(dir(alias), file))
  }
}

let rendered = 0
let skipped = 0
try {
  if (!deckFilter || deckFilter.includes("microsoft-store/extras")) {
    const dir = join(outputDir, "microsoft-store", "extras")
    await renderHtml(renderSuperHeroArtHtml(), superHeroArt, [
      { path: join(dir, "super-hero-art.png"), ...superHeroArt, format: "png" },
    ])
    await renderHtml(renderStoreLogoHtml(300), { width: 300, height: 300 }, [
      { path: join(dir, "store-logo-300.png"), width: 300, height: 300, format: "png" },
    ])
    rendered += 2
    console.log("microsoft-store/extras")
  }

  // The README banner is English only: the Mac hero window with the iPhone
  // timeline in front of it, next to the desktop hero copy. The GitHub stars
  // badge would only repeat the README's own badges.
  if (
    (!deckFilter || deckFilter.includes("github/readme")) &&
    (!localeFilter || localeFilter.includes("en"))
  ) {
    const listing = await loadListing("en")
    const copy = { ...listing.screenshots["desktop.hero"]! }
    delete copy.badge
    const html = renderSlideHtml({
      canvas: readmeBanner,
      locale: "en",
      layout: "banner",
      tone: "light",
      device: "mac",
      captures: [await loadCapture("en", "mac", "hero")],
      companion: { device: "iphone", capture: await loadCapture("en", "iphone", "timeline") },
      copy,
      eyebrowIcon: "rss-2-fill",
    })
    await renderHtml(html, readmeBanner, [
      { path: join(outputDir, "github", "readme-banner.png"), ...readmeBanner, format: "png" },
    ])
    rendered++
    console.log("github/readme")
  }

  for (const locale of listingLocales) {
    if (localeFilter && !localeFilter.includes(locale.id)) continue
    const listing = await loadListing(locale.id)

    for (const deck of decks) {
      if (deckFilter && !deckFilter.includes(deck.id)) continue

      for (const [index, slide] of deck.slides.entries()) {
        try {
          const [first, ...rest] = await Promise.all(
            slide.shots.map((shot) => loadCapture(locale.captureLocale, deck.captureDevice, shot)),
          )
          if (!first) throw new Error(`${deck.id} slide ${slide.copy} has no shots`)
          const captures: [Capture, ...Capture[]] = [first, ...rest]
          const companion = slide.companion
            ? {
                device: slide.companion.device,
                capture: await loadCapture(
                  locale.captureLocale,
                  slide.companion.device,
                  slide.companion.shot,
                ),
              }
            : undefined
          const callouts = await Promise.all(
            (slide.callouts ?? []).map(async (c) => {
              // A region measured at capture time beats the deck's default.
              const measured = await readCallout(
                join(capturesDir, locale.captureLocale, deck.captureDevice, `${c.shot}.json`),
              )
              return {
                ...c,
                rect: measured
                  ? ([measured.x, measured.y, measured.width, measured.height] as typeof c.rect)
                  : c.rect,
                capture: await loadCapture(locale.captureLocale, deck.captureDevice, c.shot),
              }
            }),
          )
          const html = renderSlideHtml({
            canvas: deck.canvas,
            locale: locale.id,
            layout: slide.layout,
            tone: slide.tone,
            device: deck.frame,
            captures,
            companion,
            callouts,
            copy: slideCopy(slide, listing.screenshots),
            eyebrowIcon: slide.eyebrowIcon,
          })
          const file = `${String(index + 1).padStart(2, "0")}-${slide.copy.split(".")[1]}.png`
          await writeForLocales(
            (storeLocale) => join(outputDir, deck.id, storeLocale),
            file,
            storeLocales(deck, locale),
            (path) =>
              renderHtml(
                html,
                deck.canvas,
                deck.outputs.map((o) => ({ ...o, path })),
              ),
          )
          rendered++
          console.log(`${deck.id} ${locale.id} ${file}`)
        } catch (error) {
          if (!(allowMissing && error instanceof MissingCaptureError)) throw error
          skipped++
          console.warn(`skipped ${deck.id} ${locale.id} ${slide.copy}: ${error.message}`)
        }
      }
    }

    const hasFeatureCapture = await access(
      join(capturesDir, locale.captureLocale, "android", "timeline.png"),
    ).then(
      () => true,
      () => false,
    )
    if (
      (!deckFilter || deckFilter.includes("google-play/feature-graphic")) &&
      (hasFeatureCapture || !allowMissing)
    ) {
      const capture = await loadCapture(locale.captureLocale, "android", "timeline")
      const copy = listing.screenshots["play.featureGraphic"]!
      await writeForLocales(
        (storeLocale) => join(outputDir, "google-play/feature-graphic", storeLocale),
        "feature-graphic.png",
        locale.googlePlay,
        (path) =>
          renderHtml(
            renderFeatureGraphicHtml({ locale: locale.id, copy, capture }),
            { width: 1024, height: 500 },
            [{ path, width: 1024, height: 500, format: "png" }],
          ),
      )
      rendered++
      console.log(`google-play/feature-graphic ${locale.id}`)
    }
  }
} finally {
  await closeBrowser()
}
console.log(
  `${rendered} images rendered into ${outputDir}${skipped ? `, ${skipped} slides skipped` : ""}`,
)
