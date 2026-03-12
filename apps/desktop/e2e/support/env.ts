import { fileURLToPath } from "node:url"

import { join } from "pathe"

export type DesktopE2EProfile = "local" | "prod"

const DESKTOP_E2E_PROFILES = {
  local: {
    apiURL: "http://localhost:3000",
    webURL: "http://localhost:2233",
    webBaseURL: "http://localhost:2233",
    webUsesHashRouter: false,
  },
  prod: {
    apiURL: "https://api.folo.is",
    webURL: "https://app.folo.is",
    webBaseURL: null,
    webUsesHashRouter: true,
  },
} as const

export interface DesktopE2EEnv {
  profile: DesktopE2EProfile
  apiURL: string
  webURL: string
  webBaseURL: string
  webUsesHashRouter: boolean
  webDevServerURL: string
  debugProxyPath: string
  desktopAppDir: string
}

const supportDir = fileURLToPath(new URL(".", import.meta.url))
const desktopAppDir = join(supportDir, "..", "..")

const normalizeRoute = (route: string) => {
  if (!route || route === "/") {
    return "/"
  }

  return route.startsWith("/") ? route : `/${route}`
}

export const resolveDesktopE2EEnv = (): DesktopE2EEnv => {
  const profile = (process.env.FOLO_E2E_PROFILE ?? "local") as DesktopE2EProfile
  const resolvedProfile = profile in DESKTOP_E2E_PROFILES ? profile : "local"
  const profileConfig = DESKTOP_E2E_PROFILES[resolvedProfile]
  const webDevServerURL = process.env.FOLO_E2E_WEB_DEV_SERVER_URL ?? "http://localhost:2233"
  const debugProxyPath = process.env.FOLO_E2E_WEB_DEBUG_PROXY_PATH ?? "/__debug_proxy.html"

  const webBaseURL =
    resolvedProfile === "prod"
      ? new URL(
          `${debugProxyPath}?debug-host=${encodeURIComponent(webDevServerURL)}`,
          profileConfig.webURL,
        ).toString()
      : profileConfig.webBaseURL

  return {
    profile: resolvedProfile,
    apiURL: process.env.FOLO_E2E_API_URL ?? profileConfig.apiURL,
    webURL: process.env.FOLO_E2E_WEB_URL ?? profileConfig.webURL,
    webBaseURL,
    webUsesHashRouter: profileConfig.webUsesHashRouter,
    webDevServerURL,
    debugProxyPath,
    desktopAppDir,
  }
}

export const buildWebAppURL = (env: DesktopE2EEnv, route = "/") => {
  const normalizedRoute = normalizeRoute(route)

  if (env.webUsesHashRouter) {
    const url = new URL(env.webBaseURL)
    url.hash = normalizedRoute
    return url.toString()
  }

  return new URL(normalizedRoute, `${env.webBaseURL}/`).toString()
}

export const buildHashRoute = (route = "/") => normalizeRoute(route)
