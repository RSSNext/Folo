import { env } from "@follow/shared/env.desktop"
import { userActions } from "@follow/store/user/store"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"
import { ofetch } from "ofetch"

import { NetworkStatus, setApiStatus } from "~/atoms/network"
import { setLoginModalShow } from "~/atoms/user"

import { getClientId, getSessionId } from "./client-session"

export const apiFetch = ofetch.create({
  baseURL: env.VITE_API_URL,
  credentials: "include",
  retry: false,
  cache: "no-store",
  onRequest: ({ options }) => {
    const header = new Headers(options.headers)

    const headers = createDesktopAPIHeaders({ version: PKG.version })

    Object.entries(headers).forEach(([key, value]) => {
      header.set(key, value)
    })

    header.set("X-Client-Id", getClientId())
    header.set("X-Session-Id", getSessionId())
    options.headers = header
  },
  onResponse() {
    setApiStatus(NetworkStatus.ONLINE)
  },
  onResponseError(context) {
    const { router } = window

    // If api is down
    if ((!context.response || context.response.status === 0) && navigator.onLine) {
      setApiStatus(NetworkStatus.OFFLINE)
    } else {
      setApiStatus(NetworkStatus.ONLINE)
    }

    if (context.response.status === 401) {
      // Or we can present LoginModal here.
      // router.navigate("/login")
      // If any response status is 401, we can set auth fail. Maybe some bug, but if navigate to login page, had same issues
      setLoginModalShow(true)
      userActions.removeCurrentUser()
    }
    try {
      const json = JSON.parse(context.response._data)
      if (context.response.status === 400 && json.code === 1003) {
        router.navigate("/invitation")
      }
    } catch {
      // ignore
    }
  },
})
