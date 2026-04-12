import { Hono } from "hono"
import { z } from "zod"

import type { Env } from "../env"
import { createExpoSignatureHeader, OtaCodeSigningError } from "../lib/code-signing"
import { KV_KEYS } from "../lib/constants"
import { buildDesktopManifestResponse, isDesktopRelease } from "../lib/desktop"
import { getLatestReleasePointer } from "../lib/kv"
import { buildManifest } from "../lib/manifest"
import { parseDesktopRequest } from "../lib/request"
import type { OtaPlatform, OtaProjectedPlatforms, OtaRelease } from "../lib/schema"
import { otaReleaseSchema } from "../lib/schema"

const OTA_PLATFORMS: readonly OtaPlatform[] = ["ios", "android", "macos", "windows", "linux"]
const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/)
const latestReleasePointerSchema = z.object({
  releaseVersion: semverSchema,
})

export const manifestRoute = new Hono<{ Bindings: Env }>()

manifestRoute.get("/manifest", async (c) => {
  const desktopRequest = parseDesktopRequest(c)

  if (desktopRequest.platformHeader) {
    const { distribution } = desktopRequest

    if (!desktopRequest.platform || !distribution) {
      return c.json({ error: "Invalid x-app-platform header" }, 400)
    }

    if (
      !desktopRequest.runtimeVersion ||
      !semverSchema.safeParse(desktopRequest.runtimeVersion).success
    ) {
      return c.json({ error: "Invalid x-app-runtime-version header" }, 400)
    }

    if (!desktopRequest.channel) {
      return c.json({ error: "Missing x-app-channel header" }, 400)
    }

    const pointerRecord = await getLatestReleasePointer(c.env.OTA_KV, {
      product: "desktop",
      channel: desktopRequest.channel,
      runtimeVersion: desktopRequest.runtimeVersion,
      platform: desktopRequest.platform,
    })

    if (!pointerRecord) {
      return c.body(null, 204)
    }

    const parsedPointer = latestReleasePointerSchema.safeParse(pointerRecord)

    if (!parsedPointer.success) {
      return c.body(null, 204)
    }

    const releaseRecord = await c.env.OTA_KV.get(
      KV_KEYS.release("desktop", parsedPointer.data.releaseVersion),
      "json",
    )

    if (!releaseRecord) {
      return c.body(null, 204)
    }

    const parsedRelease = otaReleaseSchema.safeParse(releaseRecord)

    if (!parsedRelease.success || !isDesktopRelease(parsedRelease.data)) {
      return c.body(null, 204)
    }

    const release = parsedRelease.data

    if (
      release.releaseKind !== "ota" ||
      release.channel !== desktopRequest.channel ||
      release.releaseVersion !== parsedPointer.data.releaseVersion ||
      release.runtimeVersion !== desktopRequest.runtimeVersion
    ) {
      return c.body(null, 204)
    }

    const payload = buildDesktopManifestResponse(release, {
      origin: new URL(c.req.url).origin,
      platform: desktopRequest.platform,
      distribution,
      installedBinaryVersion: desktopRequest.installedBinaryVersion,
      rendererVersion: desktopRequest.rendererVersion,
    })

    if (!payload) {
      return c.body(null, 204)
    }

    return c.json(payload, 200, {
      "cache-control": "private, max-age=0",
      "content-type": "application/json; charset=utf-8",
      vary: "x-app-platform, x-app-version, x-app-runtime-version, x-app-renderer-version, x-app-channel",
    })
  }

  const platformHeader = c.req.header("expo-platform")
  const platform = parsePlatform(platformHeader)
  const runtimeVersion = c.req.header("expo-runtime-version")
  const channel = c.req.header("expo-channel-name") ?? "production"
  const product = parseProduct(c.req.query("product"))

  if (!platformHeader) {
    return c.json({ error: "Missing expo-platform header" }, 400)
  }

  if (!platform) {
    return c.json({ error: "Invalid expo-platform header" }, 400)
  }

  if (!runtimeVersion) {
    return c.json({ error: "Missing expo-runtime-version header" }, 400)
  }

  if (!semverSchema.safeParse(runtimeVersion).success) {
    return c.json({ error: "Invalid expo-runtime-version header" }, 400)
  }

  if (!product) {
    return c.json({ error: "Invalid product query parameter" }, 400)
  }

  const pointerRecord = await getLatestReleasePointer(c.env.OTA_KV, {
    product,
    channel,
    runtimeVersion,
    platform,
  })

  if (!pointerRecord) {
    return c.body(null, 204)
  }

  const parsedPointer = latestReleasePointerSchema.safeParse(pointerRecord)

  if (!parsedPointer.success) {
    return c.body(null, 204)
  }

  const pointer = parsedPointer.data
  const releaseRecord = await c.env.OTA_KV.get(
    KV_KEYS.release(product, pointer.releaseVersion),
    "json",
  )

  if (!releaseRecord) {
    return c.body(null, 204)
  }

  const parsedRelease = otaReleaseSchema.safeParse(releaseRecord)

  if (!parsedRelease.success) {
    return c.body(null, 204)
  }

  const release: OtaRelease = parsedRelease.data

  if (
    release.releaseKind !== "ota" ||
    release.product !== product ||
    release.channel !== channel ||
    release.releaseVersion !== pointer.releaseVersion ||
    release.runtimeVersion !== runtimeVersion ||
    !(release.platforms as OtaProjectedPlatforms)[platform]
  ) {
    return c.body(null, 204)
  }

  const manifestBody = JSON.stringify(
    buildManifest(release, { origin: new URL(c.req.url).origin, platform }),
  )

  let expoSignatureHeader: string | null = null
  try {
    expoSignatureHeader = await createExpoSignatureHeader({
      manifestBody,
      expectSignatureHeader: c.req.header("expo-expect-signature"),
      privateKeyPem: c.env.OTA_CODE_SIGNING_PRIVATE_KEY,
    })
  } catch (error) {
    if (error instanceof OtaCodeSigningError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      })
    }

    throw error
  }

  const headers = new Headers({
    "cache-control": "private, max-age=0",
    "content-type": "application/expo+json; charset=utf-8",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
    vary: "expo-platform, expo-runtime-version, expo-channel-name",
  })

  if (expoSignatureHeader) {
    headers.set("expo-signature", expoSignatureHeader)
  }

  return new Response(manifestBody, {
    status: 200,
    headers,
  })
})

function parsePlatform(value: string | undefined): OtaPlatform | null {
  return OTA_PLATFORMS.find((platform) => platform === value) ?? null
}

function parseProduct(value: string | undefined): OtaRelease["product"] | null {
  if (value === undefined) {
    return "mobile"
  }

  return value === "mobile" ? "mobile" : null
}
