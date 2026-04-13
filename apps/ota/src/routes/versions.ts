import { Hono } from "hono"

import type { Env } from "../env"
import { listPublishedOtaReleases } from "../lib/github"
import {
  getLatestReleaseVersionRecord,
  getStoreVersionRecord,
  putLatestReleaseVersionRecord,
} from "../lib/kv"
import { otaReleaseSchema } from "../lib/schema"
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
  const releasesResult = await listPublishedOtaReleases({
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    token: env.GITHUB_TOKEN,
    etag: null,
  })

  if (releasesResult.kind === "not-modified") {
    return {
      mobile: null,
      desktop: null,
    }
  }

  const latestByProduct = new Map<
    "mobile" | "desktop",
    {
      product: "mobile" | "desktop"
      version: string
      publishedAt: string
      tag: string
    }
  >()

  for (const releaseSummary of releasesResult.releases) {
    const response = await fetch(releaseSummary.metadataUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch release metadata (${response.status})`)
    }

    const release = otaReleaseSchema.parse(await response.json())
    const current = latestByProduct.get(release.product)
    if (!current || compareSemver(release.releaseVersion, current.version) > 0) {
      latestByProduct.set(release.product, {
        product: release.product,
        version: release.releaseVersion,
        publishedAt: release.publishedAt,
        tag: release.git.tag,
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
