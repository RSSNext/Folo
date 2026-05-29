import { Hono } from "hono"

import type { Env } from "../env"
import { KV_KEYS } from "../lib/constants"
import { getBinaryPolicyRecord, getLatestReleaseVersionRecord } from "../lib/kv"
import type { DesktopOtaRelease } from "../lib/schema"
import { otaReleaseSchema } from "../lib/schema"

type DesktopDownloadTarget = "macos-dmg" | "windows-exe" | "linux-appimage"
type DesktopApp = NonNullable<DesktopOtaRelease["desktop"]["app"]>
type DesktopAppPlatform = NonNullable<DesktopApp["platforms"][keyof DesktopApp["platforms"]]>

const desktopDownloadTargets = {
  "macos-dmg": {
    platform: "macos",
    patterns: [/macos.*arm64.*\.dmg$/i, /\.dmg$/i],
  },
  "windows-exe": {
    platform: "windows",
    patterns: [/windows.*x64.*\.exe$/i, /\.exe$/i],
  },
  "linux-appimage": {
    platform: "linux",
    patterns: [/linux.*x64.*\.AppImage$/i, /\.AppImage$/i],
  },
} as const satisfies Record<
  DesktopDownloadTarget,
  {
    platform: keyof DesktopApp["platforms"]
    patterns: RegExp[]
  }
>

export const downloadRoute = new Hono<{ Bindings: Env }>()

downloadRoute.get("/download/desktop/macos/dmg", async (c) =>
  redirectDesktopDownload(c.env.OTA_KV, "macos-dmg", c.req.query("channel") ?? "stable"),
)

downloadRoute.get("/download/desktop/windows/exe", async (c) =>
  redirectDesktopDownload(c.env.OTA_KV, "windows-exe", c.req.query("channel") ?? "stable"),
)

downloadRoute.get("/download/desktop/linux/appimage", async (c) =>
  redirectDesktopDownload(c.env.OTA_KV, "linux-appimage", c.req.query("channel") ?? "stable"),
)

downloadRoute.get("/download/mobile/android/apk", async (c) => {
  const versionRecord = await getLatestReleaseVersionRecord(c.env.OTA_KV, "mobile")

  if (!versionRecord) {
    return c.json({ error: "Android APK version is unavailable" }, 404)
  }

  return redirectToDownload(
    `https://github.com/RSSNext/Folo/releases/download/mobile/v${versionRecord.version}/build.apk`,
  )
})

async function redirectDesktopDownload(
  kv: KVNamespace,
  targetName: DesktopDownloadTarget,
  channel: string,
) {
  const target = desktopDownloadTargets[targetName]
  const release = await getLatestDesktopDownloadRelease(kv, channel)
  const platformPayload = release?.desktop.app?.platforms[target.platform]

  if (!platformPayload) {
    return new Response(JSON.stringify({ error: "Desktop installer is unavailable" }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      status: 404,
    })
  }

  const file = findDesktopInstaller(platformPayload.files, target.patterns)
  if (!file) {
    return new Response(JSON.stringify({ error: "Desktop installer is unavailable" }), {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
      status: 404,
    })
  }

  return redirectToDownload(file.downloadUrl)
}

async function getLatestDesktopDownloadRelease(kv: KVNamespace, channel: string) {
  const policyRecord =
    (await getBinaryPolicyRecord(kv, {
      product: "desktop",
      channel,
      distribution: "direct",
    })) ??
    (await getBinaryPolicyRecord(kv, {
      product: "desktop",
      channel,
    }))

  const releaseVersion =
    policyRecord?.releaseVersion ??
    (await getLatestReleaseVersionRecord(kv, "desktop"))?.version ??
    null

  if (!releaseVersion) {
    return null
  }

  const releaseRecord = await kv.get(KV_KEYS.release("desktop", releaseVersion), "json")
  if (!releaseRecord) {
    return null
  }

  const parsedRelease = otaReleaseSchema.safeParse(releaseRecord)
  if (!parsedRelease.success || parsedRelease.data.product !== "desktop") {
    return null
  }

  return parsedRelease.data
}

function findDesktopInstaller(files: DesktopAppPlatform["files"], patterns: RegExp[]) {
  for (const pattern of patterns) {
    const file = files.find((item) => pattern.test(item.filename))
    if (file) {
      return file
    }
  }

  return null
}

function redirectToDownload(url: string) {
  return new Response(null, {
    headers: {
      "cache-control": "public, max-age=300",
      location: url,
    },
    status: 302,
  })
}
