import { Auth } from "@follow/shared/auth"
import { env } from "@follow/shared/env.ssr"
import { createDesktopAPIHeaders } from "@follow/utils/headers"

import PKG from "../../../desktop/package.json"

const headers = createDesktopAPIHeaders({ version: PKG.version })

const auth = new Auth({
  apiURL: env.VITE_API_URL,
  webURL: env.VITE_WEB_URL,
  fetchOptions: {
    headers,
    cache: "no-store",
  },
})

// @keep-sorted
export const {
  changeEmail,
  changePassword,
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
  twoFactor,
  unlinkAccount,
  updateUser,
} = auth.authClient

export const { loginHandler } = auth
