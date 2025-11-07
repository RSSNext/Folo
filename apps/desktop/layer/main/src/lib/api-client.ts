import { env } from "@follow/shared/env.desktop"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG, { mainHash, version as appVersion } from "@pkg"
import { gte } from "semver"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"
import { getCurrentRendererManifest } from "~/updater/hot-updater"

import { logger } from "../logger"

export const followClient = new FollowClient({
  credentials: "include",
  timeout: 10000,

  baseURL: env.VITE_API_URL,
  fetch: async (input, options = {}) =>
    fetch(input.toString(), {
      ...options,
      cache: "no-store",
    }),
})

export const apiClient = followClient.api

followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const header = options.headers || {}

  const apiHeader = createDesktopAPIHeaders({ version: PKG.version })
  const rendererManifest = getCurrentRendererManifest()
  const rendererVersion = gte(rendererManifest?.version ?? appVersion, appVersion)
    ? (rendererManifest?.version ?? appVersion)
    : appVersion

  // Get cookies for authentication
  const window = WindowManager.getMainWindow()
  const cookies = await window?.webContents.session.cookies.get({
    domain: new URL(env.VITE_API_URL).hostname,
  })
  const sessionCookie = cookies?.find((cookie) =>
    cookie.name.includes(BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN),
  )
  const headerCookie = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : ""
  const userAgent = window?.webContents.getUserAgent() || `Folo/${PKG.version}`

  options.headers = {
    ...header,
    ...apiHeader,
    Cookie: headerCookie,
    "User-Agent": userAgent,

    "X-Follow-Main-Hash": mainHash,
    "X-Follow-Renderer-Version": rendererVersion,
    "X-Follow-App-Version": appVersion,
    "X-Follow-Platform": process.platform,
  }
  return ctx
})
followClient.addResponseInterceptor(({ response }) => {
  logger.info(`API Response: ${response.status} ${response.statusText}`)
  return response
})

followClient.addErrorInterceptor(async ({ response, error }) => {
  if (!response) {
    logger.error("API Request failed - no response", error)
    return error
  }
})

followClient.addResponseInterceptor(async ({ response }) => {
  // Handle specific error cases if needed in main process
  if (response.status === 401) {
    logger.warn("Authentication failed in main process")
  }

  try {
    await response.clone().json()
  } catch (error) {
    logger.error("API Error details:", error)
  }

  return response
})
