import { Auth } from "@follow/shared/auth"
import { env } from "@follow/shared/env.desktop"

const auth = new Auth({
  apiURL: env.VITE_API_URL,
  webURL: env.VITE_WEB_URL,
})

export const { authClient } = auth

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
