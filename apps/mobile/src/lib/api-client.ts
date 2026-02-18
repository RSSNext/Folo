import type { UserByokProviderConfig } from "@follow/shared/settings/interface"
import { userActions } from "@follow/store/user/store"
import { createMobileAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import { fetch } from "expo/fetch"
import { nativeApplicationVersion } from "expo-application"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { getAISettings } from "../atoms/settings/ai"
import { LoginScreen } from "../screens/(modal)/LoginScreen"
import { getCookie } from "./auth"
import { getClientId, getSessionId } from "./client-session"
import { getUserAgent } from "./native/user-agent"
import { Navigation } from "./navigation/Navigation"
import { proxyEnv } from "./proxy-env"

export const followClient = new FollowClient({
  credentials: "omit",
  timeout: 30000,
  baseURL: proxyEnv.API_URL,
  fetch: async (input, options = {}) => fetch(input.toString(), options as any) as any,
})

export const followApi = followClient.api

const BYOK_PROVIDER_ROUTES = ["/ai/summary", "/ai/translation-batch"]

const normalizeByokProvider = (
  provider: UserByokProviderConfig,
): {
  provider: string
  baseURL?: string
  apiKey?: string
  headers?: Record<string, string>
} | null => {
  if (!provider?.provider) return null

  const normalized: {
    provider: string
    baseURL?: string
    apiKey?: string
    headers?: Record<string, string>
  } = {
    provider: provider.provider,
  }

  if (provider.baseURL) normalized.baseURL = provider.baseURL
  if (provider.apiKey) normalized.apiKey = provider.apiKey
  if (provider.headers && Object.keys(provider.headers).length > 0) {
    normalized.headers = provider.headers
  }

  return normalized
}

const resolveOpenAIByokProvider = () => {
  const aiSettings = getAISettings()
  const { byok } = aiSettings
  if (!byok?.enabled) return null

  const provider = byok.providers.find((item) => item.provider === "openai")
  if (!provider?.apiKey) return null

  return normalizeByokProvider(provider)
}

const shouldAttachByok = (url: string) => {
  return BYOK_PROVIDER_ROUTES.some((path) => url.includes(path))
}

followClient.addRequestInterceptor(async (ctx) => {
  const { url } = ctx

  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set("t", Date.now().toString())
    ctx.url = urlObj.toString()
  } catch {
    /* empty */
  }

  return ctx
})
followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const header = options.headers || {}
  header["X-Client-Id"] = getClientId()
  header["X-Session-Id"] = getSessionId()
  header["User-Agent"] = await getUserAgent()
  header["cookie"] = getCookie()

  const apiHeader = createMobileAPIHeaders({
    version: nativeApplicationVersion || "",
    rnPlatform: {
      OS: Platform.OS,
      isPad: Platform.OS === "ios" && Platform.isPad,
    },
    installerPackageName: await DeviceInfo.getInstallerPackageName(),
  })

  if (shouldAttachByok(ctx.url)) {
    const openaiByokProvider = resolveOpenAIByokProvider()
    if (openaiByokProvider) {
      header["X-AI-Provider-Type"] = "byok"
      header["X-AI-Provider-Config"] = JSON.stringify(openaiByokProvider)
    }
  }

  options.headers = {
    ...header,
    ...apiHeader,
  }
  return ctx
})

followClient.addResponseInterceptor(async (ctx) => {
  const { response } = ctx
  if (response.status === 401) {
    userActions.removeCurrentUser()
    Navigation.rootNavigation.presentControllerView(LoginScreen)
  } else if (response.status >= 400) {
    // try {
    //   const isJSON = response.headers.get("content-type")?.includes("application/json")
    //   const json = isJSON ? await response.json() : null
    //   if (isJSON && json?.code?.toString().startsWith("11")) {
    //   }
    // } catch (error) {
    //   console.error(`Request failed with status ${response.status}`, error)
    // }
  }

  return ctx.response
})
