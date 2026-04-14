import { Hono } from "hono"

import type { Env } from "../env"
import {
  getLatestReleaseVersionRecord,
  getStoreVersionRecord,
  putLatestReleaseVersionRecord,
} from "../lib/kv"
import { STORE_URLS } from "../lib/store-version"
import { compareSemver } from "../lib/version"

export const versionsRoute = new Hono<{ Bindings: Env }>()

versionsRoute.get("/versions", async (c) => {
  const [ios, android, mas, mss, cachedMobileRelease, cachedDesktopRelease] = await Promise.all([
    getStoreVersionRecord(c.env.OTA_KV, { product: "mobile", target: "ios" }),
    getStoreVersionRecord(c.env.OTA_KV, { product: "mobile", target: "android" }),
    getStoreVersionRecord(c.env.OTA_KV, { product: "desktop", target: "mas" }),
    getStoreVersionRecord(c.env.OTA_KV, { product: "desktop", target: "mss" }),
    getLatestReleaseVersionRecord(c.env.OTA_KV, "mobile"),
    getLatestReleaseVersionRecord(c.env.OTA_KV, "desktop"),
  ])
  let mobileRelease = cachedMobileRelease
  let desktopRelease = cachedDesktopRelease

  if (!mobileRelease || !desktopRelease) {
    const latestReleaseRecords = await backfillLatestReleaseVersions(c.env)
    mobileRelease = mobileRelease ?? latestReleaseRecords.mobile
    desktopRelease = desktopRelease ?? latestReleaseRecords.desktop
  }

  return c.json({
    store: {
      mobile: {
        ios: toStoreVersionPayload(ios, STORE_URLS.ios),
        android: toStoreVersionPayload(android, STORE_URLS.android),
      },
      desktop: {
        mas: toStoreVersionPayload(mas, STORE_URLS.mas),
        mss: toStoreVersionPayload(mss, STORE_URLS.mss),
      },
    },
    github: {
      mobile: toLatestReleasePayload(c.env, mobileRelease),
      desktop: toLatestReleasePayload(c.env, desktopRelease),
    },
  })
})

async function backfillLatestReleaseVersions(env: Env) {
  const response = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": `folo-ota-worker/${env.GITHUB_OWNER}.${env.GITHUB_REPO}`,
        ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch GitHub releases (${response.status})`)
  }

  const releases = (await response.json()) as Array<{
    tag_name?: string
    draft?: boolean
    prerelease?: boolean
    published_at?: string
  }>

  const latestByProduct = new Map<
    "mobile" | "desktop",
    {
      product: "mobile" | "desktop"
      version: string
      publishedAt: string
      tag: string
    }
  >()

  for (const release of releases) {
    if (release.draft || release.prerelease || !release.tag_name || !release.published_at) {
      continue
    }

    const parsed = parseProductReleaseTag(release.tag_name)
    if (!parsed) {
      continue
    }

    const current = latestByProduct.get(parsed.product)
    if (!current || compareSemver(parsed.version, current.version) > 0) {
      latestByProduct.set(parsed.product, {
        product: parsed.product,
        version: parsed.version,
        publishedAt: release.published_at,
        tag: release.tag_name,
      })
    }
  }

  const mobile = latestByProduct.get("mobile") ?? null
  const desktop = latestByProduct.get("desktop") ?? null

  if (mobile) {
    await putLatestReleaseVersionRecord(env.OTA_KV, mobile)
  }

  if (desktop) {
    await putLatestReleaseVersionRecord(env.OTA_KV, desktop)
  }

  return {
    mobile,
    desktop,
  }
}

function parseProductReleaseTag(
  tag: string,
): { product: "mobile" | "desktop"; version: string } | null {
  const match = tag.match(/^(mobile|desktop)\/v(\d+\.\d+\.\d+)$/)
  if (!match) {
    return null
  }

  const [, product, version] = match
  if ((product !== "mobile" && product !== "desktop") || !version) {
    return null
  }

  return {
    product,
    version,
  }
}

function toStoreVersionPayload(
  record: Awaited<ReturnType<typeof getStoreVersionRecord>>,
  url: string,
) {
  if (!record) {
    return null
  }

  return {
    version: record.version,
    fetchedAt: record.fetchedAt,
    source: record.source,
    url,
  }
}

function toLatestReleasePayload(
  env: Env,
  record: Awaited<ReturnType<typeof getLatestReleaseVersionRecord>>,
) {
  if (!record) {
    return null
  }

  return {
    version: record.version,
    publishedAt: record.publishedAt,
    tag: record.tag,
    url: `https://github.com/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/releases/tag/${record.tag}`,
  }
}
