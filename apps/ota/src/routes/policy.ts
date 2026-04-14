import { Hono } from "hono"
import { z } from "zod"

import type { Env } from "../env"
import { getStoreVersionRecord, putStoreVersionRecord } from "../lib/kv"
import { evaluateBinaryPolicy, evaluateStorePolicy } from "../lib/policy"
import { parseDesktopRequest } from "../lib/request"
import type { OtaRelease } from "../lib/schema"
import type { MobileStorePlatform } from "../lib/store-version"
import {
  fetchDesktopStoreVersion,
  fetchMobileStoreVersion,
  getDesktopStoreUrl,
} from "../lib/store-version"

const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/)

export const policyRoute = new Hono<{ Bindings: Env }>()

policyRoute.get("/policy", async (c) => {
  const desktopRequest = parseDesktopRequest(c)

  if (desktopRequest.platformHeader) {
    if (!desktopRequest.platform || !desktopRequest.distribution) {
      return c.json({ error: "Invalid x-app-platform header" }, 400)
    }

    if (!desktopRequest.installedBinaryVersion) {
      return c.json({ error: "Missing x-app-version header" }, 400)
    }

    if (!semverSchema.safeParse(desktopRequest.installedBinaryVersion).success) {
      return c.json({ error: "Invalid x-app-version header" }, 400)
    }

    if (!desktopRequest.channel) {
      return c.json({ error: "Missing x-app-channel header" }, 400)
    }

    if (desktopRequest.channel !== "stable") {
      return c.json(
        evaluateBinaryPolicy({
          installedBinaryVersion: desktopRequest.installedBinaryVersion,
          distribution: desktopRequest.distribution,
          latestStoreVersion: null,
          storeUrl: null,
        }),
      )
    }

    const cachedStoreVersion = await getStoreVersionRecord(c.env.OTA_KV, {
      product: "desktop",
      target: desktopRequest.distribution,
    })
    const storeUrl = getDesktopStoreUrl(desktopRequest.distribution)
    const version =
      cachedStoreVersion?.version ??
      (desktopRequest.distribution === "direct"
        ? null
        : await fetchAndCacheDesktopStoreVersion(c.env.OTA_KV, desktopRequest.distribution))

    return c.json(
      evaluateBinaryPolicy({
        installedBinaryVersion: desktopRequest.installedBinaryVersion,
        distribution: desktopRequest.distribution,
        latestStoreVersion: version,
        storeUrl,
      }),
    )
  }

  const product = parseProduct(c.req.query("product"))
  const platform = parseMobileStorePlatform(c.req.query("platform"))
  const channel = c.req.query("channel") ?? "production"
  const installedBinaryVersion = c.req.query("installedBinaryVersion")

  if (!product) {
    return c.json({ error: "Invalid product query parameter" }, 400)
  }

  if (!platform) {
    return c.json({ error: "Missing platform query parameter" }, 400)
  }

  if (!installedBinaryVersion) {
    return c.json({ error: "Missing installedBinaryVersion query parameter" }, 400)
  }

  if (!semverSchema.safeParse(installedBinaryVersion).success) {
    return c.json({ error: "Invalid installedBinaryVersion query parameter" }, 400)
  }

  if (channel !== "production") {
    return c.json(
      evaluateStorePolicy(null, {
        installedBinaryVersion,
      }),
    )
  }

  const cachedStoreVersion = await getStoreVersionRecord(c.env.OTA_KV, {
    product: "mobile",
    target: platform,
  })
  const latestStoreVersion =
    cachedStoreVersion?.version ?? (await fetchAndCacheMobileStoreVersion(c.env.OTA_KV, platform))

  return c.json(
    evaluateStorePolicy(latestStoreVersion, {
      installedBinaryVersion,
    }),
  )
})

function parseProduct(value: string | undefined): OtaRelease["product"] | null {
  if (value === undefined) {
    return "mobile"
  }

  return value === "mobile" ? "mobile" : null
}

function parseMobileStorePlatform(value: string | undefined): MobileStorePlatform | null {
  if (value === "ios" || value === "android") {
    return value
  }

  return null
}

async function fetchAndCacheMobileStoreVersion(kv: KVNamespace, platform: MobileStorePlatform) {
  const version = await fetchMobileStoreVersion(platform)
  if (!version) {
    return null
  }

  await putStoreVersionRecord(kv, {
    product: "mobile",
    target: platform,
    value: {
      version,
      fetchedAt: new Date().toISOString(),
      source: platform === "ios" ? "app-store" : "google-play",
    },
  })

  return version
}

async function fetchAndCacheDesktopStoreVersion(kv: KVNamespace, distribution: "mas" | "mss") {
  const { version } = await fetchDesktopStoreVersion(distribution)
  if (!version) {
    return null
  }

  await putStoreVersionRecord(kv, {
    product: "desktop",
    target: distribution,
    value: {
      version,
      fetchedAt: new Date().toISOString(),
      source: distribution === "mas" ? "mac-app-store" : "microsoft-store",
    },
  })

  return version
}
