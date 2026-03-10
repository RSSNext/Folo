import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { userActions } from "@follow/store/user/store"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG from "@pkg"

import { NetworkStatus, setApiStatus } from "~/atoms/network"
import { setLoginModalShow } from "~/atoms/user"

import { ipcServices } from "./client"
import { getAuthSessionToken, getClientId, getSessionId } from "./client-session"

const electronFetch = async (input: string | URL | Request, options: RequestInit = {}) => {
  const authService = ipcServices?.auth as
    | (NonNullable<typeof ipcServices>["auth"] & {
        request?: (payload: {
          input: string
          init?: { method?: string; headers?: Record<string, string>; body?: string }
        }) => Promise<{ status: number; headers: Record<string, string>; body: string }>
      })
    | undefined

  if (!authService?.request) {
    return fetch(input.toString(), {
      ...options,
      cache: "no-store",
    })
  }

  const headers = new Headers(options.headers)
  const response = await authService.request({
    input: input.toString(),
    init: {
      method: options.method,
      headers: Object.fromEntries(headers.entries()),
      body: typeof options.body === "string" ? options.body : undefined,
    },
  })

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  })
}

export const followClient = new FollowClient({
  credentials: "include",
  timeout: 30000,
  baseURL: env.VITE_API_URL,
  fetch: async (input, options = {}) =>
    IN_ELECTRON
      ? electronFetch(input, options)
      : fetch(input.toString(), {
          ...options,
          cache: "no-store",
        }),
})

export const followApi = followClient.api
followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const header = options.headers || {}
  header["X-Client-Id"] = getClientId()
  header["X-Session-Id"] = getSessionId()

  const authSessionToken = IN_ELECTRON ? getAuthSessionToken() : null
  if (authSessionToken) {
    header.Cookie = `__Secure-better-auth.session_token=${authSessionToken}; better-auth.session_token=${authSessionToken}`
  }

  const apiHeader = createDesktopAPIHeaders({ version: PKG.version })

  options.headers = {
    ...header,
    ...apiHeader,
  }
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
    if (IN_ELECTRON && getAuthSessionToken()) {
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
