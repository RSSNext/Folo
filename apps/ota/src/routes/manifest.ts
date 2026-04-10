import { Hono } from "hono"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { getLatestReleasePointer } from "../lib/kv"
import { buildManifest } from "../lib/manifest"
import type { OtaPlatform, OtaRelease } from "../lib/schema"

const OTA_PLATFORMS: readonly OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]
const OTA_PRODUCTS = ["mobile", "desktop"] as const

export const manifestRoute = new Hono<{ Bindings: Env }>()

manifestRoute.get("/manifest", async (c) => {
  const platform = parsePlatform(c.req.header("expo-platform"))
  const runtimeVersion = c.req.header("expo-runtime-version") ?? ""
  const channel = c.req.header("expo-channel-name") ?? "production"
  const product = parseProduct(c.req.query("product"))

  if (!platform) {
    return c.body(null, 204)
  }

  const pointer = await getLatestReleasePointer(c.env.OTA_KV, {
    product,
    channel,
    runtimeVersion,
    platform,
  })

  if (!pointer) {
    return c.body(null, 204)
  }

  const release = await c.env.OTA_KV.get<OtaRelease>(
    KV_KEYS.release(product, pointer.releaseVersion),
    "json",
  )

  if (!release || !release.platforms[platform]) {
    return c.body(null, 204)
  }

  return new Response(
    JSON.stringify(buildManifest(release, { origin: new URL(c.req.url).origin, platform })),
    {
      status: 200,
      headers: {
        "cache-control": "private, max-age=0",
        "content-type": "application/expo+json; charset=utf-8",
        "expo-protocol-version": "1",
        "expo-sfv-version": "0",
        vary: "expo-platform, expo-runtime-version, expo-channel-name",
      },
    },
  )
})

function parsePlatform(value: string | undefined): OtaPlatform | null {
  if (!value) {
    return "ios"
  }

  return OTA_PLATFORMS.find((platform) => platform === value) ?? null
}

function parseProduct(value: string | undefined): OtaRelease["product"] {
  return OTA_PRODUCTS.find((product) => product === value) ?? "mobile"
}
