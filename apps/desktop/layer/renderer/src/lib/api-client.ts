import { buildBetterAuthSessionTokenCookieHeader } from "@follow/shared/auth-cookie"
import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { whoami } from "@follow/store/user/getters"
import { userActions } from "@follow/store/user/store"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG from "@pkg"

import { setLoginModalShow } from "~/atoms/user"

import { ipcServices } from "./client"
import { getAuthSessionToken, getClientId, getSessionId } from "./client-session"

const isElectronRuntime = () => {
  return IN_ELECTRON || (typeof window !== "undefined" && !!window.electron)
}

const fetchWithElectronAuth = async (request: Request) => {
  const requestURL = new URL(request.url)
  const apiURL = new URL(env.VITE_API_URL)
  const authService = ipcServices?.auth as
    | (NonNullable<typeof ipcServices>["auth"] & {
        fetchWithAuth?: (payload: {
          body?: string
          headers?: Record<string, string>
          method: string
          url: string
        }) => Promise<{
          body: string
          headers: [string, string][]
          status: number
          statusText: string
        }>
      })
    | undefined

  if (!isElectronRuntime() || requestURL.origin !== apiURL.origin || !authService?.fetchWithAuth) {
    return fetch(request)
  }

  const body =
    request.method !== "GET" && request.method !== "HEAD" ? await request.clone().text() : undefined
  const response = await authService.fetchWithAuth({
    body,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url,
  })

  return new Response(response.body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  })
}

export const followClient = new FollowClient({
  credentials: "include",
  timeout: 60_000,
  baseURL: env.VITE_API_URL,
  fetch: async (input, options = {}) => {
    const request = new Request(input.toString(), {
      ...options,
      cache: "no-store",
    })
    return fetchWithElectronAuth(request)
  },
})

export const followApi = followClient.api
followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const headers = new Headers(options.headers)
  headers.set("X-Client-Id", getClientId())
  headers.set("X-Session-Id", getSessionId())

  const authSessionToken = isElectronRuntime() ? getAuthSessionToken() : null
  if (authSessionToken && !headers.has("Cookie") && !headers.has("cookie")) {
    headers.set(
      "Cookie",
      buildBetterAuthSessionTokenCookieHeader(env.VITE_API_URL, authSessionToken),
    )
  }

  const apiHeader = createDesktopAPIHeaders({ version: PKG.version })
  Object.entries(apiHeader).forEach(([key, value]) => {
    headers.set(key, value)
  })

  options.headers = Object.fromEntries(headers.entries())
  return ctx
})

followClient.addResponseInterceptor(async ({ response }) => {
  if (response.status === 401) {
    const authSessionToken = isElectronRuntime() ? getAuthSessionToken() : null
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
