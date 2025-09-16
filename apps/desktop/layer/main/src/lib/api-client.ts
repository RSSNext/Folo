import { env } from "@follow/shared/env.desktop"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG from "@pkg"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

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

export const followApi = followClient.api

followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const header = options.headers || {}

  const apiHeader = createDesktopAPIHeaders({ version: PKG.version })

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
    const json = await response.clone().json()
    logger.error("API Error details:", json)
  } catch {
    // ignore JSON parsing errors
  }

  return response
})

// Legacy export for compatibility
export const apiClient = followApi
