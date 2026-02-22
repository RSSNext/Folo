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
 * Enhanced login handler that supports native Sign in with Apple on Mac App Store builds.
 * For Apple provider on MAS builds, it uses the native AuthenticationServices
 * framework to get an identity token, then authenticates with the server using the idToken flow.
 * Non-MAS builds (DMG) use web-based Apple Sign In.
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
  // Check if we should use native Apple Sign In (only available on MAS builds)
  if (provider === "apple" && ipcServices) {
    console.info("[Apple Auth] Checking native availability...")
    try {
      const isNativeAvailable = await ipcServices.auth.isNativeAppleAuthAvailable()
      console.info("[Apple Auth] isNativeAvailable:", isNativeAvailable)

      if (isNativeAvailable) {
        console.info("[Apple Auth] Calling signInWithApple...")
        const result = await ipcServices.auth.signInWithApple()
        console.info("[Apple Auth] signInWithApple result:", {
          success: result.success,
          hasData: !!result.data,
          error: result.error,
        })

        if (!result.success || !result.data) {
          // If user canceled, just return silently
          if (result.error?.includes("canceled")) {
            console.info("[Apple Auth] User canceled, returning silently")
            return
          }
          console.error("[Apple Auth] Native sign in failed:", result.error)
          throw new Error(result.error || "Failed to sign in with Apple")
        }

        console.info("[Apple Auth] Got identity token, authenticating with server...")
        // Use the identity token to authenticate with the server
        // The idToken flow in better-auth doesn't redirect, it authenticates directly
        return authClient.signIn.social({
          provider: "apple",
          idToken: {
            token: result.data.identityToken,
          },
        })
      } else {
        console.info("[Apple Auth] Native not available, falling back to web")
      }
    } catch (error) {
      console.error("[Apple Auth] Native Apple Sign In failed:", error)
      // Fall through to web-based Apple Sign In
    }
  }

  // Use the default login handler for all other cases
  console.info("[Apple Auth] Using web-based login handler")
  return auth.loginHandler(provider, runtime, args)
}
