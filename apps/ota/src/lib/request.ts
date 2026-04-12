import type { Context } from "hono"

import type { Env } from "../env"
import type { DesktopDistribution, OtaPlatform } from "./schema"

const DESKTOP_PLATFORM_MAP: Record<
  string,
  {
    platform: Extract<OtaPlatform, "macos" | "windows" | "linux">
    distribution: DesktopDistribution
  }
> = {
  "desktop/macos/dmg": { platform: "macos", distribution: "direct" },
  "desktop/macos/mas": { platform: "macos", distribution: "mas" },
  "desktop/windows/exe": { platform: "windows", distribution: "direct" },
  "desktop/windows/ms": { platform: "windows", distribution: "mss" },
  "desktop/linux": { platform: "linux", distribution: "direct" },
}

export function parseDesktopRequest(c: Context<{ Bindings: Env }>) {
  const platformHeader = c.req.header("x-app-platform")
  const mapped = platformHeader ? DESKTOP_PLATFORM_MAP[platformHeader] : undefined
  const installedBinaryVersion = c.req.header("x-app-version") ?? null
  const runtimeVersion = c.req.header("x-app-runtime-version") ?? installedBinaryVersion
  const rendererVersion = c.req.header("x-app-renderer-version") ?? null
  const channel = c.req.header("x-app-channel") ?? null

  return {
    platformHeader,
    product: "desktop" as const,
    platform: mapped?.platform ?? null,
    distribution: mapped?.distribution ?? null,
    installedBinaryVersion,
    runtimeVersion,
    rendererVersion,
    channel,
  }
}
