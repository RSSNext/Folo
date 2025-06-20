import type { AppType } from "@follow/shared"
import { env } from "@follow/shared/env.desktop"
import PKG from "@pkg"
import { hc } from "hono/client"
import { ofetch } from "ofetch"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { logger } from "../logger"

const abortController = new AbortController()
export const apiFetch = ofetch.create({
  baseURL: env.VITE_API_URL,
  credentials: "include",
  signal: abortController.signal,
  retry: false,
  onRequest({ request }) {
    logger.info(`API Request: ${request.toString()}`)
  },
  onRequestError(context) {
    if (context.error.name === "AbortError") {
      return
    }
  },
})

export const apiClient = hc<AppType>("", {
  fetch: async (input, options = {}) => apiFetch(input.toString(), options),
  async headers() {
    const window = WindowManager.getMainWindow()
    const cookies = await window?.webContents.session.cookies.get({
      domain: new URL(env.VITE_API_URL).hostname,
    })
    const sessionCookie = cookies?.find((cookie) =>
      cookie.name.includes(BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN),
    )
    const headerCookie = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : ""

    return {
      "X-App-Version": PKG.version,
      "X-App-Dev": process.env.NODE_ENV === "development" ? "1" : "0",
      Cookie: headerCookie,
      "User-Agent": `Folo/${PKG.version}`,
    }
  },
})
