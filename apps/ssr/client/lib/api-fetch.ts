import { env } from "@follow/shared/env.ssr"
import type { AppType } from "@follow/shared/hono"
import { createSSRAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import { hc } from "hono/client"
import { ofetch } from "ofetch"

import PKG from "../../../desktop/package.json"

const apiFetch = ofetch.create({
  credentials: "include",
  retry: false,
  cache: "no-store",
  onRequest: ({ options }) => {
    const header = new Headers(options.headers)

    const headers = createSSRAPIHeaders({ version: PKG.version })

    Object.entries(headers).forEach(([key, value]) => {
      header.set(key, value)
    })

    options.headers = header
  },
})

export const apiClient = hc<AppType>(env.VITE_EXTERNAL_API_URL || env.VITE_API_URL, {
  fetch: async (input: any, options = {}) =>
    apiFetch(input.toString(), options).catch((err) => {
      throw err
    }),
})

export const followClient = new FollowClient({
  credentials: "include",
  timeout: 10000,
  baseURL: env.VITE_EXTERNAL_API_URL || env.VITE_API_URL,
  fetch: async (input: any, options = {}) =>
    fetch(input.toString(), {
      ...options,
      cache: "no-store",
    }),
})

followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const header = new Headers(options.headers)

  const headers = createSSRAPIHeaders({ version: PKG.version })

  Object.entries(headers).forEach(([key, value]) => {
    header.set(key, value)
  })

  options.headers = Object.fromEntries(header.entries())
  return ctx
})
