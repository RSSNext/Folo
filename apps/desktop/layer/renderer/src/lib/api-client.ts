import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { whoami } from "@follow/store/user/getters"
import { userActions } from "@follow/store/user/store"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG from "@pkg"

import { NetworkStatus, setApiStatus } from "~/atoms/network"
import { setLoginModalShow } from "~/atoms/user"

import { getAuthSessionToken, getClientId, getSessionId } from "./client-session"

export const followClient = new FollowClient({
  credentials: "include",
  timeout: 60_000,
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
  const headers = new Headers(options.headers)
  headers.set("X-Client-Id", getClientId())
  headers.set("X-Session-Id", getSessionId())

  const authSessionToken = IN_ELECTRON ? getAuthSessionToken() : null
  if (authSessionToken && !headers.has("Cookie") && !headers.has("cookie")) {
    headers.set(
      "Cookie",
      `__Secure-better-auth.session_token=${authSessionToken}; better-auth.session_token=${authSessionToken}`,
    )
  }

  const apiHeader = createDesktopAPIHeaders({ version: PKG.version })
  Object.entries(apiHeader).forEach(([key, value]) => {
    headers.set(key, value)
  })

  options.headers = Object.fromEntries(headers.entries())
  return ctx
})

followClient.addResponseInterceptor(({ response }) => {
  setApiStatus(NetworkStatus.ONLINE)
  return response
})

followClient.addErrorInterceptor(async ({ error, response }) => {
  // If api is down
  if ((!response || response.status === 0) && navigator.onLine) {
    setApiStatus(NetworkStatus.OFFLINE)
  } else {
    setApiStatus(NetworkStatus.ONLINE)
  }

  if (!response) {
    return error
  }

  return error
})

followClient.addResponseInterceptor(async ({ response }) => {
  if (response.status === 401) {
    const authSessionToken = IN_ELECTRON ? getAuthSessionToken() : null
    const shouldPromptForLogin =
      response.url.includes("/better-auth/get-session") || (!whoami() && !authSessionToken)

    if (!shouldPromptForLogin) {
      return response
    }

    // Or we can present LoginModal here.
    // router.navigate("/login")
    // If any response status is 401, we can set auth fail. Maybe some bug, but if navigate to login page, had same issues
    setLoginModalShow(true)
    userActions.removeCurrentUser()
  }
  try {
    const isJSON = response.headers.get("content-type")?.includes("application/json")
    if (!isJSON) return response
    const _json = await response.clone().json()

    const isError = response.status >= 400
    if (!isError) return response
  } catch {
    // ignore
  }

  return response
})
