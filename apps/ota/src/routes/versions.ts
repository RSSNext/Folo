import { Hono } from "hono"

import type { Env } from "../env"
import { getLatestReleaseVersionRecord, getStoreVersionRecord } from "../lib/kv"
import { STORE_URLS } from "../lib/store-version"

export const versionsRoute = new Hono<{ Bindings: Env }>()

versionsRoute.get("/versions", async (c) => {
  const [ios, android, mas, mss, mobileRelease, desktopRelease] = await Promise.all([
    getStoreVersionRecord(c.env.OTA_KV, { product: "mobile", target: "ios" }),
    getStoreVersionRecord(c.env.OTA_KV, { product: "mobile", target: "android" }),
    getStoreVersionRecord(c.env.OTA_KV, { product: "desktop", target: "mas" }),
    getStoreVersionRecord(c.env.OTA_KV, { product: "desktop", target: "mss" }),
    getLatestReleaseVersionRecord(c.env.OTA_KV, "mobile"),
    getLatestReleaseVersionRecord(c.env.OTA_KV, "desktop"),
  ])

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
