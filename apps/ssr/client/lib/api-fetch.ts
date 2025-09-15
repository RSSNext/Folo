import "client-only"

import { env } from "@follow/shared/env.ssr"
import { createSSRAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"

import PKG from "../../../desktop/package.json"

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
