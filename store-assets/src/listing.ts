import { readFile } from "node:fs/promises"

import { join } from "pathe"

import type { SlideCopy } from "./slide"

export const listingRoot = join(import.meta.dirname, "..", "listing")

export interface AppStoreFields {
  name: string
  subtitle: string
  promotionalText: string
  keywords: { ios: string; macos: string }
}

export interface GooglePlayFields {
  title: string
  shortDescription: string
}

export interface MicrosoftStoreFields {
  shortDescription: string
  features: string[]
  screenshotCaptions: string[]
}

export interface Listing {
  locale: string
  appStore: AppStoreFields & { descriptionIos: string; descriptionMacos: string }
  googlePlay: GooglePlayFields & { fullDescription: string }
  microsoftStore: MicrosoftStoreFields & { description: string }
  screenshots: Record<string, SlideCopy>
}

const readText = async (locale: string, file: string) =>
  (await readFile(join(listingRoot, locale, file), "utf8")).trim()

const readJson = async <T>(locale: string, file: string) =>
  JSON.parse(await readFile(join(listingRoot, locale, file), "utf8")) as T

export const loadListing = async (locale: string): Promise<Listing> => {
  const [appStore, googlePlay, microsoftStore, screenshots] = await Promise.all([
    readJson<AppStoreFields>(locale, "app-store.json"),
    readJson<GooglePlayFields>(locale, "google-play.json"),
    readJson<MicrosoftStoreFields>(locale, "microsoft-store.json"),
    readJson<Record<string, SlideCopy>>(locale, "screenshots.json"),
  ])
  return {
    locale,
    appStore: {
      ...appStore,
      descriptionIos: await readText(locale, "app-store-ios.txt"),
      descriptionMacos: await readText(locale, "app-store-macos.txt"),
    },
    googlePlay: { ...googlePlay, fullDescription: await readText(locale, "google-play.txt") },
    microsoftStore: {
      ...microsoftStore,
      description: await readText(locale, "microsoft-store.txt"),
    },
    screenshots,
  }
}

// Store limits, counted the way each console counts them (Unicode code points).
export const limits = {
  appStore: { name: 30, subtitle: 30, promotionalText: 170, keywords: 100, description: 4000 },
  googlePlay: { title: 30, shortDescription: 80, fullDescription: 4000 },
  microsoftStore: {
    description: 10_000,
    shortDescription: 1000,
    shortDescriptionVisible: 270,
    features: 20,
    feature: 200,
    caption: 200,
  },
} as const

export const length = (value: string) => [...value].length
