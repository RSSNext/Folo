import { env } from "@follow/shared/env"
import type { authPlugins } from "@follow/shared/hono"
import type { BetterAuthClientPlugin } from "better-auth/client"
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { IN_ELECTRON, WEB_URL } from "./constants"

type AuthPlugin = (typeof authPlugins)[number]
const serverPlugins = [
  {
    id: "customGetProviders",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "customGetProviders" }>,
  },
  {
    id: "customCreateSession",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "customCreateSession" }>,
  },
  {
    id: "getAccountInfo",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "getAccountInfo" }>,
  },
  inferAdditionalFields({
    user: {
      handle: {
        type: "string",
        required: false,
      },
    },
  }),
] satisfies BetterAuthClientPlugin[]

const authClient = createAuthClient({
  baseURL: `${env.VITE_API_URL}/better-auth`,
  plugins: [...serverPlugins, twoFactorClient()],
})

// @keep-sorted
export const {
  changeEmail,
  changePassword,
  createSession,
  forgetPassword,
  getAccountInfo,
  getProviders,
  getSession,
  linkSocial,
  listAccounts,
  resetPassword,
  sendVerificationEmail,
  signIn,
  signOut,
  signUp,
  twoFactor,
  unlinkAccount,
  updateUser,
} = authClient

export type LoginRuntime = "browser" | "app"
export const loginHandler = async (
  provider: string,
  runtime?: LoginRuntime,
  args?: {
    email?: string
    password?: string
  },
) => {
  const { email, password } = args ?? {}
  if (IN_ELECTRON && provider !== "credential") {
    window.open(`${WEB_URL}/login?provider=${provider}`)
  } else {
    if (provider === "credential") {
      if (!email || !password) {
        window.location.href = "/login"
        return
      }
      return signIn.email({ email, password })
    }

    signIn.social({
      provider: provider as "google" | "github" | "apple",
      callbackURL: runtime === "app" ? `${WEB_URL}/login` : WEB_URL,
    })
  }
}
