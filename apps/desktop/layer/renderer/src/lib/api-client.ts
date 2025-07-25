import { env } from "@follow/shared/env.desktop"
import { userActions } from "@follow/store/user/store"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import PKG from "@pkg"
import { createElement } from "react"
import { toast } from "sonner"

import { NetworkStatus, setApiStatus } from "~/atoms/network"
import { setLoginModalShow } from "~/atoms/user"
import { NeedActivationToast } from "~/modules/activation/NeedActivationToast"

import { getClientId, getSessionId } from "./client-session"

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
  header["X-Client-Id"] = getClientId()
  header["X-Session-Id"] = getSessionId()

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
  const { router } = window

  // If api is down
  if ((!response || response.status === 0) && navigator.onLine) {
    setApiStatus(NetworkStatus.OFFLINE)
  } else {
    setApiStatus(NetworkStatus.ONLINE)
  }

  if (!response) {
    return error
  }

  if (response.status === 401) {
    // Or we can present LoginModal here.
    // router.navigate("/login")
    // If any response status is 401, we can set auth fail. Maybe some bug, but if navigate to login page, had same issues
    setLoginModalShow(true)
    userActions.removeCurrentUser()
  }
  try {
    const json = await response.clone().json()

    if (response.status === 400 && json.code === 1003) {
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

  return error
})
