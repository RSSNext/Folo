import { DEV } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import type { AppType } from "@follow/shared/hono"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"
import { hc } from "hono/client"
import { FetchError, ofetch } from "ofetch"
import { createElement } from "react"
import { toast } from "sonner"

import { NetworkStatus, setApiStatus } from "~/atoms/network"
import { setLoginModalShow } from "~/atoms/user"
import { NeedActivationToast } from "~/modules/activation/NeedActivationToast"
import { DebugRegistry } from "~/modules/debug/registry"

import { getClientId, getSessionId } from "./client-session"

export const apiFetch = ofetch.create({
  baseURL: env.VITE_API_URL,
  credentials: "include",
  retry: false,
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
    }
    try {
      const json = JSON.parse(context.response._data)
      if (context.response.status === 400 && json.code === 1003) {
        router.navigate("/invitation")
      }
      if (json.code.toString().startsWith("11")) {
        setTimeout(() => {
          const toastId = toast.error(
            createElement(NeedActivationToast, {
              dimiss: () => {
                toast.dismiss(toastId)
              },
            }),
            {
              closeButton: true,
              duration: 10e4,

              classNames: {
                content: tw`w-full`,
              },
            },
          )
        }, 500)
      }
    } catch {
      // ignore
    }
  },
})

export const apiClient = hc<AppType>(env.VITE_API_URL, {
  fetch: async (input, options = {}) =>
    apiFetch(input.toString(), options).catch((err) => {
      if (err instanceof FetchError && !err.response) {
        setApiStatus(NetworkStatus.OFFLINE)
      }
      throw err
    }),
})

if (DEV) {
  DebugRegistry.add("Activation Toast", () => {
    setTimeout(() => {
      const toastId = toast.error(
        createElement(NeedActivationToast, {
          dimiss: () => {
            toast.dismiss(toastId)
          },
        }),
        {
          closeButton: true,
          duration: 10e4,
          classNames: {
            content: tw`w-full`,
          },
        },
      )
    }, 500)
  })
}
