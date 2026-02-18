import { createMobileAPIHeaders } from "@follow/utils/headers"
import { nativeApplicationVersion } from "expo-application"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { getCookie, oneTimeToken } from "./auth"
import { getClientId, getSessionId } from "./client-session"
import { getUserAgent } from "./native/user-agent"
import { proxyEnv } from "./proxy-env"

const LEGACY_PROD_API_URL = "https://api.follow.is"
const NEW_PROD_API_URL = "https://api.folo.is"

const authSessionEndpoint = "/better-auth/get-session"
const migrationRequestTimeout = 6000
let migrationAttempted = false

const fetchWithTimeout = async (input: string, options: RequestInit) => {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, migrationRequestTimeout)

  try {
    return await fetch(input, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

const createMigrationHeaders = async () => {
  const headers = createMobileAPIHeaders({
    version: nativeApplicationVersion || "",
    rnPlatform: {
      OS: Platform.OS,
      isPad: Platform.OS === "ios" && Platform.isPad,
    },
    installerPackageName: await DeviceInfo.getInstallerPackageName(),
  })

  return {
    ...headers,
    "X-Client-Id": getClientId(),
    "X-Session-Id": getSessionId(),
    "User-Agent": await getUserAgent(),
    "expo-origin": "follow://",
    "x-skip-oauth-proxy": "true",
  }
}

const hasValidSessionOnApiDomain = async (apiURL: string) => {
  const cookie = getCookie()
  if (!cookie) {
    return false
  }

  try {
    const migrationHeaders = await createMigrationHeaders()
    const response = await fetchWithTimeout(`${apiURL}${authSessionEndpoint}`, {
      credentials: "omit",
      headers: {
        cookie,
        ...migrationHeaders,
      },
      method: "GET",
    })

    if (!response.ok) {
      return false
    }

    const data = (await response.json()) as { user?: unknown }
    return Boolean(data?.user)
  } catch {
    return false
  }
}

const getLegacyOneTimeToken = async () => {
  const cookie = getCookie()
  if (!cookie) {
    return null
  }

  try {
    const migrationHeaders = await createMigrationHeaders()
    const response = await fetchWithTimeout(
      `${LEGACY_PROD_API_URL}/better-auth/one-time-token/generate`,
      {
        credentials: "omit",
        headers: {
          cookie,
          ...migrationHeaders,
        },
        method: "GET",
      },
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as { token?: string }
    return data.token ?? null
  } catch {
    return null
  }
}

export const migrateLegacyApiSession = async () => {
  if (migrationAttempted) {
    return
  }
  migrationAttempted = true

  if (proxyEnv.API_URL !== NEW_PROD_API_URL) {
    return
  }

  const hasSessionOnNewApi = await hasValidSessionOnApiDomain(NEW_PROD_API_URL)
  if (hasSessionOnNewApi) {
    return
  }

  const hasSessionOnLegacyApi = await hasValidSessionOnApiDomain(LEGACY_PROD_API_URL)
  if (!hasSessionOnLegacyApi) {
    return
  }

  const token = await getLegacyOneTimeToken()
  if (!token) {
    return
  }

  await oneTimeToken.apply({ token })
}
