import { Auth } from "@follow/shared/auth"
import { env } from "@follow/shared/env.ssr"
import { APP_LANGUAGE_HEADER, createDesktopAPIHeaders } from "@follow/utils/headers"

import PKG from "../../../desktop/package.json"
import { getGeneralSettings } from "../atoms/settings/general"

const headers = createDesktopAPIHeaders({ version: PKG.version })

const auth = new Auth({
  apiURL: env.VITE_API_URL,
  webURL: env.VITE_WEB_URL,
  fetchOptions: {
    headers,
    cache: "no-store",
    onRequest: (context) => {
      const { language } = getGeneralSettings()
      if (language) {
        context.headers.set(APP_LANGUAGE_HEADER, language)
      }
    },
  },
})

// @keep-sorted
export const {
  changeEmail,
  changePassword,
  getAccountInfo,
  getLastUsedLoginMethod,
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
  twoFactor,
  unlinkAccount,
  updateUser,
} = auth.authClient

export const forgetPassword = auth.authClient.requestPasswordReset

export const { loginHandler } = auth
