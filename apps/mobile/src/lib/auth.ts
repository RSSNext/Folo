import { expoClient } from "@better-auth/expo/client"
import { baseAuthPlugins } from "@follow/shared/auth"
import { isNewUserQueryKey } from "@follow/store/user/constants"
import { whoamiQueryKey } from "@follow/store/user/hooks"
import { useQuery } from "@tanstack/react-query"
import { createAuthClient } from "better-auth/react"
import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

import { proxyEnv } from "./proxy-env"
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
  signOut,
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
