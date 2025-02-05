/* eslint-disable no-console */
import type { AppType } from "@follow/shared"
import { router } from "expo-router"
import { FetchError, ofetch } from "ofetch"

import { getCookie } from "./auth"
import { getApiUrl } from "./env"

const { hc } = require("hono/dist/cjs/client/client") as typeof import("hono/client")

export const apiFetch = ofetch.create({
  retry: false,

  baseURL: getApiUrl(),
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
      router.replace("/login")
    } else {
      console.error(error)
    }
  },
})

export const apiClient = hc<AppType>(getApiUrl(), {
  fetch: async (input: any, options = {}) =>
    apiFetch(input.toString(), options).catch((err) => {
      throw err
    }),
  headers() {
    return {
      "X-App-Name": "Follow Mobile",
      cookie: getCookie(),
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
