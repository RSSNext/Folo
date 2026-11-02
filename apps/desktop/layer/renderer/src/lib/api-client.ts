import { buildBetterAuthSessionTokenCookieHeader } from "@follow/shared/auth-cookie"
import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { whoami } from "@follow/store/user/getters"
import { userActions } from "@follow/store/user/store"
import { trackApiConnection } from "@follow/utils/api-connection"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG from "@pkg"

import { setApiUnreachable } from "~/atoms/api-connection"
import { setLoginModalShow } from "~/atoms/user"

import { ipcServices } from "./client"
import { getAuthSessionToken, getClientId, getSessionId } from "./client-session"

const isElectronRuntime = () => {
  return IN_ELECTRON || (typeof window !== "undefined" && !!window.electron)
}

/**
 * The main process hands the body over as text, so a `204 No Content` arrives as an empty
 * string. `Response` refuses any body, even an empty one, for these statuses; passing one
 * threw, and a thrown fetch counts as "the server cannot be reached".
 */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304])

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

  return new Response(NULL_BODY_STATUSES.has(response.status) ? null : response.body, {
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

/**
 * Whether the API answers at all, checked the way ordinary requests travel (through the main
 * process in Electron). Any HTTP status counts as an answer; the endpoint needs no session.
 */
const probeApiReachability = async () => {
  const request = new Request(new URL("/status/configs", env.VITE_API_URL), {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  await fetchWithElectronAuth(request)
  return true
}

const apiRecoveredListeners = new Set<() => void>()

/** Called when the API answers again after it could not be reached. */
export const onApiRecovered = (listener: () => void) => {
  apiRecoveredListeners.add(listener)
  return () => {
    apiRecoveredListeners.delete(listener)
  }
}

trackApiConnection(followClient, {
  probe: probeApiReachability,
  onUnreachable: () => setApiUnreachable(true),
  onRecovered: () => {
    setApiUnreachable(false)
    for (const listener of apiRecoveredListeners) {
      try {
        listener()
      } catch (error) {
        console.error("[api-connection] recovery listener threw", error)
      }
    }
  },
})
