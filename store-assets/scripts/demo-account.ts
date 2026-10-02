// Switches the demo account's subscriptions to the curated set for one UI
// locale: `tsx store-assets/scripts/demo-account.ts zh-Hans [--dry-run]`.
// Feeds outside the set are unsubscribed, missing ones are followed, and
// category names are localized so the sidebar reads naturally.
import { readFile } from "node:fs/promises"

import { join } from "pathe"

import { apiRequest, connectCdp } from "../src/cdp"
import type { AppUiLocale } from "../src/locales"
import { appUiLocales } from "../src/locales"

interface FeedSpec {
  url: string
  view: number
  category: string
  // Custom subscription title, for feeds whose own title is generic (YouTube
  // upload playlists are all titled "Videos").
  title?: string
  // Kept out of the main timeline; used to demo AI translation.
  hideFromTimeline?: boolean
}

interface Catalog {
  categories: Record<string, Record<AppUiLocale, string>>
  shared: FeedSpec[]
  locales: Record<AppUiLocale, FeedSpec[]>
  translation: Record<AppUiLocale, FeedSpec>
}

interface Subscription {
  feedId: string | null
  listId: string | null
  view: number
  category: string | null
  title: string | null
  hideFromTimeline: boolean | null
  feeds?: { url: string; title: string | null }
}

interface ApiResponse<T> {
  code: number
  message?: string
  data: T
}

const locale = process.argv[2] as AppUiLocale
const dryRun = process.argv.includes("--dry-run")
// Unfollow everything first. Subscriptions created by sign-up onboarding do not
// surface their older entries in view timelines; following again fixes that.
const reset = process.argv.includes("--reset")
// Keep the other locales' video feeds followed but hidden from timelines. A new
// native YouTube feed only gets its thumbnails from its first scheduled refresh,
// which needs a subscriber, so parking them lets that happen in the meantime.
const parkVideos = process.argv.includes("--park-videos")
// Leave out the translation demo feed, e.g. while capturing timelines: for
// English it is a Chinese feed that would show up in the English timeline.
const skipTranslation = process.argv.includes("--skip-translation")
if (!appUiLocales.includes(locale)) {
  throw new Error(
    `Usage: demo-account.ts <${appUiLocales.join("|")}> [--dry-run] [--reset] [--park-videos] [--skip-translation]`,
  )
}

const catalog = JSON.parse(
  await readFile(join(import.meta.dirname, "..", "demo-account", "feeds.json"), "utf8"),
) as Catalog
const own = [
  ...catalog.shared,
  ...catalog.locales[locale],
  ...(skipTranslation ? [] : [catalog.translation[locale]]),
]
const ownUrls = new Set(own.map((f) => f.url))
const parked = parkVideos
  ? appUiLocales
      .filter((l) => l !== locale)
      .flatMap((l) => catalog.locales[l])
      .filter((f) => f.url.startsWith("https://www.youtube.com/feeds/") && !ownUrls.has(f.url))
      .filter((f, index, all) => all.findIndex((g) => g.url === f.url) === index)
      .map((f) => ({ ...f, hideFromTimeline: true }))
  : []
const desired = [...own, ...parked].map((f) => ({
  ...f,
  category: catalog.categories[f.category]?.[locale] ?? f.category,
}))

const session = await connectCdp()

// A request that fails (a timeout while a new feed imports, a gateway error
// page instead of JSON) is reported and retried in the next round.
const request = async <T>(method: string, path: string, body?: unknown) => {
  try {
    return await apiRequest<ApiResponse<T>>(session, method, path, body)
  } catch (error) {
    return { code: -1, message: (error as Error).message, data: undefined as T }
  }
}

const diff = (current: Subscription[]) => {
  const byUrl = new Map(current.filter((s) => s.feeds).map((s) => [s.feeds!.url, s]))
  const wanted = new Set(desired.map((f) => f.url))
  return {
    byUrl,
    stale: current.filter((s) => s.feedId && !wanted.has(s.feeds?.url ?? "")),
    missing: desired.filter((f) => !byUrl.has(f.url)),
    changed: desired.filter((f) => {
      const s = byUrl.get(f.url)
      return (
        s &&
        (s.view !== f.view ||
          s.category !== f.category ||
          (s.title ?? null) !== (f.title ?? null) ||
          Boolean(s.hideFromTimeline) !== Boolean(f.hideFromTimeline))
      )
    }),
  }
}

try {
  if (reset && !dryRun) {
    const current = await request<Subscription[]>("GET", "/subscriptions")
    await request("DELETE", "/subscriptions", {
      feedIdList: current.data.map((s) => s.feedId).filter(Boolean),
    })
  }

  for (let round = 1; round <= 3; round++) {
    const current = await request<Subscription[]>("GET", "/subscriptions")
    if (current.code !== 0) throw new Error(`Could not list subscriptions: ${current.message}`)
    const { byUrl, stale, missing, changed } = diff(current.data)
    console.log(
      `${locale}: ${stale.length} to unfollow, ${missing.length} to follow, ${changed.length} to update`,
    )
    if (dryRun) {
      for (const s of stale) console.log(`  - ${s.feeds?.title ?? s.feeds?.url}`)
      for (const f of missing) console.log(`  + ${f.url}`)
      for (const f of changed) console.log(`  ~ ${f.url} -> view ${f.view}, ${f.category}`)
      break
    }
    if (stale.length + missing.length + changed.length === 0) break

    if (stale.length > 0) {
      const res = await request("DELETE", "/subscriptions", {
        feedIdList: stale.map((s) => s.feedId),
      })
      if (res.code !== 0) console.warn(`unfollow failed: ${res.message}`)
    }
    for (const f of missing) {
      const res = await request("POST", "/subscriptions", {
        url: f.url,
        view: f.view,
        category: f.category,
        title: f.title ?? null,
        isPrivate: false,
        hideFromTimeline: f.hideFromTimeline ?? false,
      })
      console.log(
        `  ${res.code === 0 ? "+" : "!"} ${f.url}${res.code === 0 ? "" : ` (${res.message})`}`,
      )
    }
    for (const f of changed) {
      const res = await request("PATCH", "/subscriptions", {
        feedId: byUrl.get(f.url)!.feedId,
        view: f.view,
        category: f.category,
        title: f.title ?? null,
        isPrivate: false,
        hideFromTimeline: f.hideFromTimeline ?? false,
      })
      if (res.code !== 0) console.warn(`update failed for ${f.url}: ${res.message}`)
    }
  }
} finally {
  session.close()
}
