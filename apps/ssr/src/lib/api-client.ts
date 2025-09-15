import "./load-env"

import { requestContext } from "@fastify/request-context"
import { env } from "@follow/shared/env.ssr"
import { createSSRAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import { ofetch } from "ofetch"

import PKG from "../../../desktop/package.json"

const getBaseURL = () => {
  const req = requestContext.get("req")!
  const { host } = req.headers
  let baseURL = env.VITE_EXTERNAL_API_URL || env.VITE_API_URL

  if (env.VITE_EXTERNAL_API_URL?.startsWith("/")) {
    baseURL = `http://${host}${env.VITE_EXTERNAL_API_URL}`
  }

  const upstreamEnv = req.requestContext.get("upstreamEnv")
  if (upstreamEnv === "dev" && env.VITE_EXTERNAL_DEV_API_URL) {
    baseURL = env.VITE_EXTERNAL_DEV_API_URL
  }
  if (upstreamEnv === "prod" && env.VITE_EXTERNAL_PROD_API_URL) {
    baseURL = env.VITE_EXTERNAL_PROD_API_URL
  }
  return baseURL
}
export const createApiFetch = () => {
  const baseURL = getBaseURL()

  return ofetch.create({
    credentials: "include",
    retry: false,
    cache: "no-store",
    onRequest(context) {
      if (__DEV__) console.info(`request: ${context.request}`)

      const header = new Headers(context.options.headers)

      const headers = createSSRAPIHeaders({ version: PKG.version })

      Object.entries(headers).forEach(([key, value]) => {
        header.set(key, value)
      })

      context.options.headers = header
    },
    onRequestError(context) {
      if (context.error.name === "AbortError") {
        return
      }
    },
    baseURL,
  })
}

export const createFollowClient = () => {
  const authSessionToken = getTokenFromCookie(requestContext.get("req")?.headers.cookie || "")

  const baseURL = getBaseURL()

  const client = new FollowClient({
    credentials: "include",
    timeout: 10000,
    baseURL,
    fetch: async (input: any, options = {}) => fetch(input.toString(), options),
  })

  client.addRequestInterceptor(async (ctx) => {
    const { options } = ctx
    const header = new Headers(options.headers)

    const headers = createSSRAPIHeaders({ version: PKG.version })

    Object.entries(headers).forEach(([key, value]) => {
      header.set(key, value)
    })

    if (authSessionToken) {
      header.set("Cookie", `__Secure-better-auth.session_token=${authSessionToken}`)
    }

    options.headers = Object.fromEntries(header.entries())
    return ctx
  })

  return client
}

export const getTokenFromCookie = (cookie: string) => {
  const parsedCookieMap = cookie
    .split(";")
    .map((item) => item.trim())
    .reduce(
      (acc, item) => {
        const [key, value] = item.split("=")
        acc[key!] = value!
        return acc
      },
      {} as Record<string, string>,
    )
  return parsedCookieMap["__Secure-better-auth.session_token"]
}
