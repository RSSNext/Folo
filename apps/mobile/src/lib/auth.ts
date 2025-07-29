import { expoClient } from "@better-auth/expo/client"
import { baseAuthPlugins } from "@follow/shared/auth"
import { isNewUserQueryKey } from "@follow/store/user/constants"
import { whoamiQueryKey } from "@follow/store/user/hooks"
import { createMobileAPIHeaders } from "@follow/utils/headers"
import { useQuery } from "@tanstack/react-query"
import { createAuthClient } from "better-auth/react"
import { nativeApplicationVersion } from "expo-application"
import * as FileSystem from "expo-file-system"
import * as SecureStore from "expo-secure-store"
import Storage from "expo-sqlite/kv-store"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { getDbPath } from "@/src/database"

import { getClientId, getSessionId } from "./client-session"
import { getUserAgent } from "./native/user-agent"
import { getEnvProfile, proxyEnv } from "./proxy-env"
import { queryClient } from "./query-client"

const storagePrefix = "follow_auth"
export const cookieKey = `${storagePrefix}_cookie`
export const sessionTokenKey = "__Secure-better-auth.session_token"

const plugins = [
  ...baseAuthPlugins,
  expoClient({
    scheme: "follow",
    storagePrefix,
    storage: {
      setItem(key, value) {
        SecureStore.setItem(key, value)

        if (key === cookieKey) {
          if (__DEV__) {
            const env = getEnvProfile()
            SecureStore.setItem(`${cookieKey}_${env}`, value)
          }
          queryClient.invalidateQueries({ queryKey: whoamiQueryKey })
          queryClient.invalidateQueries({ queryKey: isNewUserQueryKey })
        }
      },
      getItem: SecureStore.getItem,
    },
  }),
]

export const authClient = createAuthClient({
  baseURL: `${proxyEnv.API_URL}/better-auth`,
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
  forgetPassword,
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

export const signOut = async () => {
  await authClient.signOut()
  const dbPath = getDbPath()
  await FileSystem.deleteAsync(dbPath)
  await expo.reloadAppAsync("User sign out")
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
