import "./load-env"

import { requestContext } from "@fastify/request-context"
import { env } from "@follow/shared/env.ssr"
import type { AppType } from "@follow/shared/hono"
import { hc } from "hono/client"
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
    onRequest(context) {
      if (__DEV__) console.info(`request: ${context.request}`)

      context.options.headers.set("User-Agent", `Folo External Server Api Client/${PKG.version}`)
    },
    onRequestError(context) {
      if (context.error.name === "AbortError") {
        return
      }
    },
    baseURL,
  })
}
export const createApiClient = () => {
  const authSessionToken = getTokenFromCookie(requestContext.get("req")?.headers.cookie || "")

  const baseURL = getBaseURL()
  const apiFetch = createApiFetch()

  const apiClient = hc<AppType>(baseURL, {
    fetch: async (input: any, options = {}) => apiFetch(input.toString(), options),
    headers() {
      return {
        "X-App-Version": PKG.version,
        "X-App-Dev": __DEV__ ? "1" : "0",
        "User-Agent": `Folo External Server Api Client/${PKG.version}`,
        Cookie: authSessionToken ? `__Secure-better-auth.session_token=${authSessionToken}` : "",
      }
    },
  })
  return apiClient
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

export type ApiClient = ReturnType<typeof createApiClient>
