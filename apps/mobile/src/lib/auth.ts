import { expoClient, getSetCookie, storageAdapter } from "@better-auth/expo/client"
import type { BaseAuthPlugins } from "@follow/shared/auth"
import { baseAuthPlugins } from "@follow/shared/auth"
import { isNewUserQueryKey } from "@follow/store/user/constants"
import { whoamiQueryKey } from "@follow/store/user/hooks"
import { userActions } from "@follow/store/user/store"
import { createMobileAPIHeaders } from "@follow/utils/headers"
import { useQuery } from "@tanstack/react-query"
import type { BetterAuthClientOptions } from "better-auth/client"
import { createAuthClient } from "better-auth/react"
import { nativeApplicationVersion } from "expo-application"
import * as FileSystem from "expo-file-system/legacy"
import Storage from "expo-sqlite/kv-store"
import * as WebBrowser from "expo-web-browser"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { getDbPath } from "@/src/database"

import {
  createMobileAuthCookieSyncPlugin,
  createSessionAwareAuthCookieStorage,
} from "./auth-cookie-sync"
import { getClientId, getSessionId } from "./client-session"
import { getUserAgent } from "./native/user-agent"
import { Navigation } from "./navigation/Navigation"
import { getEnvProfile, proxyEnv } from "./proxy-env"
import { queryClient } from "./query-client"
import { reloadApp } from "./reload-app"
import { safeSecureStore } from "./secure-store"
import type { SocialSignInResult } from "./social-auth"
import { buildAuthorizationProxyURL, parseSocialAuthCallbackURL } from "./social-auth"

const storagePrefix = "follow_auth"
export const cookieKey = `${storagePrefix}_cookie`
export const sessionTokenKey = "__Secure-better-auth.session_token"
const sessionDataKey = `${storagePrefix}_session_data`
const sessionCookieRefreshIntervalSeconds = 60 * 60 * 12

let authStateRevision = 0
let lastAuthStateChangeAt = 0

export const getAuthStateRevision = () => authStateRevision
export const getLastAuthStateChangeAt = () => lastAuthStateChangeAt

const bumpAuthStateRevision = () => {
  authStateRevision += 1
  lastAuthStateChangeAt = Date.now()
  return authStateRevision
}

// Session-scoped queries must be reset on auth transitions, otherwise mounted timeline
// queries can keep rendering anonymous cache under the new session.
const refreshSessionQueries = () =>
  Promise.allSettled([
    queryClient.invalidateQueries({ queryKey: whoamiQueryKey }),
    queryClient.invalidateQueries({ queryKey: isNewUserQueryKey }),
    queryClient.resetQueries({ queryKey: ["entries"] }),
    queryClient.resetQueries({ queryKey: ["subscription"] }),
    queryClient.resetQueries({ queryKey: ["unread"] }),
    queryClient.resetQueries({ queryKey: ["owned", "lists"] }),
    queryClient.resetQueries({ queryKey: ["action", "rules"] }),
  ])

type MobileAuthPlugins = [
  ...BaseAuthPlugins,
  ReturnType<typeof createMobileAuthCookieSyncPlugin>,
  ReturnType<typeof expoClient>,
]
type MobileAuthClientOptions = Omit<BetterAuthClientOptions, "plugins"> & {
  plugins: MobileAuthPlugins
}

const secureAuthCookieStorage = {
  setItem(key: string, value: string) {
    try {
      safeSecureStore.setItem(key, value)
    } catch (e) {
      console.warn("SecureStore.setItem failed:", e)
      return
    }

    if (key === cookieKey) {
      if (__DEV__) {
        const env = getEnvProfile()
        try {
          safeSecureStore.setItem(`${cookieKey}_${env}`, value)
        } catch {
          // Keychain may be unavailable in background
        }
      }
    }
  },
  getItem(key: string) {
    try {
      return safeSecureStore.getItem(key)
    } catch (e) {
      console.warn("SecureStore.getItem failed:", e)
      return null
    }
  },
  removeItem(key: string) {
    try {
      safeSecureStore.removeItem(key)
    } catch (e) {
      console.warn("SecureStore.removeItem failed:", e)
      return
    }

    if (key === cookieKey) {
      if (__DEV__) {
        const env = getEnvProfile()
        safeSecureStore.removeItem(`${cookieKey}_${env}`)
      }
    }
  },
}

const authCookieStorage = createSessionAwareAuthCookieStorage({
  cookieKey,
  storage: secureAuthCookieStorage,
  onSessionChange() {
    bumpAuthStateRevision()
    void refreshSessionQueries()
  },
})

// Share Better Auth's write queue and recoverable UTF-8 chunk storage with its
// Expo plugin so a two-factor cookie update cannot race a session refresh.
const expoCookieStorage = storageAdapter(authCookieStorage)

const plugins = [
  ...baseAuthPlugins,
  createMobileAuthCookieSyncPlugin({
    cookieKey,
    storage: authCookieStorage,
    cookieStorage: {
      getItem: expoCookieStorage.getItem,
      setItem: expoCookieStorage.setItemAsync,
    },
  }),
  expoClient({
    scheme: "folo",
    storagePrefix,
    storage: authCookieStorage,
  }),
] as MobileAuthPlugins

const getAuthBaseURL = () => `${proxyEnv.API_URL}/better-auth`

export const authClient = createAuthClient<MobileAuthClientOptions>({
  baseURL: getAuthBaseURL(),
  sessionOptions: {
    refetchInterval: sessionCookieRefreshIntervalSeconds,
    refetchOnWindowFocus: true,
  },
  fetchOptions: {
    cache: "no-store",
    // Learn more: https://better-fetch.vercel.app/docs/hooks
    onRequest: async (ctx) => {
      const headers = createMobileAPIHeaders({
        version: nativeApplicationVersion || "",
        rnPlatform: {
          OS: Platform.OS,
          isPad: Platform.OS === "ios" && Platform.isPad,
        },
        installerPackageName: await DeviceInfo.getInstallerPackageName(),
      })

      Object.entries(headers).forEach(([key, value]) => {
        ctx.headers.set(key, value)
      })
      ctx.headers.set("User-Agent", await getUserAgent())

      const value = Storage.getItemSync("referral-code")
      if (value) {
        const referralCode = JSON.parse(value)
        if (referralCode) {
          ctx.headers.set("folo-referral-code", referralCode)
        }
      }

      return ctx
    },
    headers: {
      "X-Client-Id": getClientId(),
      "X-Session-Id": getSessionId(),
    },
  },
  plugins,
})

// @keep-sorted
export const {
  changeEmail,
  changePassword,
  getAccountInfo,
  getCookie,
  getProviders,
  linkSocial,
  oneTimeToken,
  sendVerificationEmail,
  signIn,
  signUp,
  twoFactor,
  unlinkAccount,
  updateUser,
  useSession,
} = authClient

// Mount Better Auth's session atom so the Expo plugin can persist refreshed Set-Cookie metadata.
export const useAuthSessionCookieRefresh = () => {
  useSession()
}

export const forgetPassword = authClient.requestPasswordReset

/**
 * Runs the same auth session as the Expo plugin's automatic redirect, but reports how it ended,
 * so a failed callback can be shown instead of leaving the user on the login screen.
 */
export const signInWithSocialProvider = async (
  provider: string,
  callbackURL: string,
): Promise<SocialSignInResult> => {
  const { data, error } = await signIn.social({
    provider,
    callbackURL,
    // Without it a failed callback ends on the website instead of returning to the app.
    errorCallbackURL: callbackURL,
    disableRedirect: true,
  })
  if (error || !data?.url) {
    return { type: "error", error: error?.code || error?.message || "sign_in_request_failed" }
  }

  if (Platform.OS === "android") {
    try {
      WebBrowser.dismissAuthSession()
    } catch {
      // No Custom Tab left over from an earlier attempt.
    }
  }

  const session = await WebBrowser.openAuthSessionAsync(
    buildAuthorizationProxyURL({
      authBaseURL: getAuthBaseURL(),
      authorizationURL: data.url,
      storedCookie: expoCookieStorage.getItem(cookieKey),
    }),
    callbackURL,
  )
  if (session.type !== "success") {
    return { type: "cancel" }
  }

  const { result, cookie } = parseSocialAuthCallbackURL(session.url)
  if (cookie) {
    const previousCookie = await expoCookieStorage.getItemAsync(cookieKey)
    await expoCookieStorage.setItemAsync(
      cookieKey,
      getSetCookie(cookie, previousCookie ?? undefined),
    )
    authClient.$store.notify("$sessionSignal")
  }
  return result
}

export interface AuthProvider {
  name: string
  id: string
  color: string
  icon: string
  icon64: string
  iconDark64?: string
}

export const useAuthProviders = () => {
  return useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const data = (await getProviders()).data as Record<string, AuthProvider>
      if (Platform.OS !== "ios") {
        delete data.apple
      }
      return data
    },
  })
}

export function isAuthCodeValid(authCode: string) {
  return (
    authCode.length === 6 && !Array.from(authCode).some((c) => Number.isNaN(Number.parseInt(c)))
  )
}

const clearAuthStorage = async () => {
  const keys = [cookieKey, sessionTokenKey, sessionDataKey]
  if (__DEV__) {
    keys.push(`${cookieKey}_${getEnvProfile()}`)
  }

  await Promise.all(keys.map((key) => safeSecureStore.removeItemAsync(key)))
}

export const signOut = async () => {
  try {
    await authClient.signOut()
  } catch (error) {
    console.warn(
      `[auth] Remote sign out failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  await clearAuthStorage()
  await userActions.removeCurrentUser()
  Navigation.rootNavigation.popToRoot()
  bumpAuthStateRevision()
  await refreshSessionQueries()
  const dbPath = getDbPath()
  await FileSystem.deleteAsync(dbPath, { idempotent: true })
  await reloadApp("User sign out")
}

export const deleteUser = async ({ TOTPCode }: { TOTPCode?: string }) => {
  if (!TOTPCode) {
    return
  }
  await authClient.deleteUserCustom({
    TOTPCode,
  })
  await signOut()
}
