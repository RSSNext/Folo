import { Auth } from "@follow/shared/auth"
import { env } from "@follow/shared/env.desktop"
import { createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"

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

export const { loginHandler } = auth
