import { Auth } from "@follow/shared/auth"
import { buildBetterAuthSessionTokenCookieHeader } from "@follow/shared/auth-cookie"
import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { APP_LANGUAGE_HEADER, createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"

import { getGeneralSettings } from "~/atoms/settings/general"

import { getAuthSessionToken } from "./client-session"

const headers = createDesktopAPIHeaders({ version: PKG.version })

const auth = new Auth({
  apiURL: env.VITE_API_URL,
  webURL: env.VITE_WEB_URL,
  fetchOptions: {
    headers,
    onRequest: (context) => {
      // Read per request, so emails follow a language switched after start-up.
      context.headers.set(APP_LANGUAGE_HEADER, getGeneralSettings().language)
      const authSessionToken = IN_ELECTRON ? getAuthSessionToken() : null
      if (authSessionToken) {
        context.headers.set(
          "Cookie",
          buildBetterAuthSessionTokenCookieHeader(env.VITE_API_URL, authSessionToken),
        )
      }
    },
  },
})

export const { authClient } = auth

// @keep-sorted
export const {
  changeEmail,
  changePassword,
  deleteUserCustom,
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

export const forgetPassword = auth.authClient.requestPasswordReset

export const { loginHandler } = auth
