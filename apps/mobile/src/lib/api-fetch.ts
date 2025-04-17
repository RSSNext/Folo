/* eslint-disable no-console */
import type { AppType } from "@follow/shared"
import { FetchError, ofetch } from "ofetch"

import { InvitationScreen } from "../screens/(modal)/InvitationScreen"
import { userActions } from "../store/user/store"
import { getCookie } from "./auth"
import { getUserAgent } from "./native/user-agent"
import { Navigation } from "./navigation/Navigation"
import { proxyEnv } from "./proxy-env"

const { hc } = require("hono/dist/cjs/client/client") as typeof import("hono/client")

export const apiFetch = ofetch.create({
  retry: false,

  baseURL: proxyEnv.API_URL,
  onRequest: async (ctx) => {
    const { options, request } = ctx
    if (__DEV__) {
      // Logger
      console.log(`---> ${options.method} ${request as string}`)
    }

    // add cookie
    options.headers = options.headers || new Headers()
    options.headers.set("cookie", getCookie())
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
          Navigation.rootNavigation.presentControllerView(InvitationScreen)
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
      "X-App-Name": "Folo Mobile",
      cookie: getCookie(),
      "User-Agent": await getUserAgent(),
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
