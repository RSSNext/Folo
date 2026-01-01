import type { LoginRuntime } from "@follow/shared/auth"
import { Auth } from "@follow/shared/auth"
import { env } from "@follow/shared/env.desktop"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"

import { ipcServices } from "./client"

const headers = createDesktopAPIHeaders({ version: PKG.version })

const auth = new Auth({
  apiURL: env.VITE_API_URL,
  webURL: env.VITE_WEB_URL,
  fetchOptions: {
    headers,
  },
})

export const { authClient } = auth

// @keep-sorted
export const {
  changeEmail,
  changePassword,
  deleteUserCustom,
  forgetPassword,
  getAccountInfo,
  getProviders,
  getSession,
  linkSocial,
  listAccounts,
  oneTimeToken,
  resetPassword,
  sendVerificationEmail,
  signIn,
  signOut,
  signUp,
  subscription,
  twoFactor,
  unlinkAccount,
  updateUser,
} = auth.authClient

/**
 * Enhanced login handler that supports native Sign in with Apple on MAS builds.
 * For Apple provider on MAS, it uses the native AuthenticationServices framework
 * to get an identity token, then authenticates with the server using the idToken flow.
 */
export const loginHandler = async (
  provider: string,
  runtime?: LoginRuntime,
  args?: {
    email?: string
    password?: string
    headers?: Record<string, string>
  },
) => {
  // Check if we should use native Apple Sign In
  // Only available on MAS builds with IPC services
  if (provider === "apple" && process.mas && ipcServices) {
    try {
      const isNativeAvailable = await ipcServices.auth.isNativeAppleAuthAvailable()

      if (isNativeAvailable) {
        const result = await ipcServices.auth.signInWithApple()

        if (!result.success || !result.data) {
          // If user canceled, just return silently
          if (result.error?.includes("canceled")) {
            return
          }
          throw new Error(result.error || "Failed to sign in with Apple")
        }

        // Use the identity token to authenticate with the server
        // The idToken flow in better-auth doesn't redirect, it authenticates directly
        return authClient.signIn.social({
          provider: "apple",
          idToken: {
            token: result.data.identityToken,
          },
        })
      }
    } catch (error) {
      console.error("Native Apple Sign In failed:", error)
      // Fall through to web-based Apple Sign In
    }
  }

  // Use the default login handler for all other cases
  return auth.loginHandler(provider, runtime, args)
}
