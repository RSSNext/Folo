/* eslint-disable no-console */
import type { AppType } from "@follow/shared"
import { userActions } from "@follow/store/user/store"
import { createMobileAPIHeaders } from "@follow/utils/headers"
import { nativeApplicationVersion } from "expo-application"
import { hc } from "hono/client"
import { FetchError, ofetch } from "ofetch"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { PlanScreen } from "../modules/settings/routes/Plan"
import { getCookie } from "./auth"
import { getClientId, getSessionId } from "./client-session"
import { getUserAgent } from "./native/user-agent"
import { Navigation } from "./navigation/Navigation"
import { proxyEnv } from "./proxy-env"

export const apiFetch = ofetch.create({
  retry: false,
  credentials: "omit",
  baseURL: proxyEnv.API_URL,
  cache: "no-store",
  onRequest: async (ctx) => {
    const { options, request } = ctx
    if (__DEV__) {
      // Logger
      console.log(`---> ${options.method} ${request as string}`)
    }

    // add cookie
    options.headers = options.headers || new Headers()
    options.headers.set("cookie", getCookie())

    const headers = createMobileAPIHeaders({
      version: nativeApplicationVersion || "",
      rnPlatform: {
        OS: Platform.OS,
        isPad: Platform.OS === "ios" && Platform.isPad,
      },
      installerPackageName: await DeviceInfo.getInstallerPackageName(),
    })

    Object.entries(headers).forEach(([key, value]) => {
      options.headers.set(key, value)
    })
  },
  onRequestError: ({ error, request, options }) => {
    if (__DEV__) {
      console.log(`[Error] ---> ${options.method} ${request as string}`)
    }
    console.error(error)
  },

  onResponse: ({ response, request, options }) => {
    if (__DEV__) {
      console.log(`<--- ${response.status} ${options.method} ${request as string}`)
    }
  },
  onResponseError: ({ error, request, options, response }) => {
    if (__DEV__) {
      console.log(`<--- [Error] ${response.status} ${options.method} ${request as string}`)
    }
    if (response.status === 401) {
      userActions.removeCurrentUser()
    } else {
      try {
        const json = JSON.parse(response._data)
        console.error(`Request ${request as string} failed with status ${response.status}`, json)

        if (json.code.toString().startsWith("11")) {
          Navigation.rootNavigation.presentControllerView(PlanScreen)
        }
      } catch {
        console.error(`Request ${request as string} failed with status ${response.status}`, error)
      }
    }
  },
})

export const apiClient = hc<AppType>(proxyEnv.API_URL, {
  fetch: async (input: any, options = {}) =>
    apiFetch(input.toString(), options).catch((err) => {
      throw err
    }),
  async headers() {
    return {
      cookie: getCookie(),
      "User-Agent": await getUserAgent(),
      "X-Client-Id": getClientId(),
      "X-Session-Id": getSessionId(),
    }
  },
})

export const getBizFetchErrorMessage = (error: Error) => {
  if (error instanceof FetchError && error.response) {
    try {
      const data = JSON.parse(error.response._data)

      if (data.message && data.code) {
        // TODO i18n handle by code
        return data.message
      }
    } catch {
      return error.message
    }
  }
  return error.message
}
