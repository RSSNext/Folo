import { stripeClient } from "@better-auth/stripe/client"
import { IN_ELECTRON } from "@follow/shared"
import type { authPlugins } from "@follow/shared/hono"
import type { BetterAuthClientPlugin, BetterFetchOption } from "better-auth/client"
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

type AuthPlugin = (typeof authPlugins)[number]
export const baseAuthPlugins = [
  {
    id: "customGetProviders",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "customGetProviders" }>,
  },
  {
    id: "getAccountInfo",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "getAccountInfo" }>,
  },
  {
    id: "deleteUserCustom",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "deleteUserCustom" }>,
  },
  {
    id: "oneTimeToken",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "oneTimeToken" }>,
  },
  inferAdditionalFields({
    user: {
      handle: {
        type: "string",
        required: false,
      },
    },
  }),
  twoFactorClient(),
  stripeClient({ subscription: true }),
] satisfies BetterAuthClientPlugin[]

export type AuthClient<ExtraPlugins extends BetterAuthClientPlugin[] = []> = ReturnType<
  typeof createAuthClient<{
    plugins: [...typeof baseAuthPlugins, ...ExtraPlugins]
  }>
>
export type LoginRuntime = "browser" | "app"

export class Auth {
  authClient: AuthClient

  constructor(
    private readonly options: {
      apiURL: string
      webURL: string
      fetchOptions?: BetterFetchOption
    },
  ) {
    this.authClient = createAuthClient({
      baseURL: `${this.options.apiURL}/better-auth`,
      plugins: baseAuthPlugins,
      fetchOptions: {
        ...this.options.fetchOptions,
        cache: "no-store",
        onRequest: (context) => {
          const referralCode = localStorage.getItem(getStorageNS("referral-code"))
          if (referralCode) {
            context.headers.set("folo-referral-code", referralCode)
          }

          this.options.fetchOptions?.onRequest?.(context)

          return context
        },
      },
    })
  }

  loginHandler = async (
    provider: string,
    runtime?: LoginRuntime,
    args?: {
      email?: string
      password?: string
      headers?: Record<string, string>
    },
  ) => {
    const { email, password, headers } = args ?? {}
    if (IN_ELECTRON && provider !== "credential") {
      window.open(`${this.options.webURL}/login?provider=${provider}`)
    } else {
      if (provider === "credential") {
        if (!email || !password) {
          window.location.href = "/login"
          return
        }
        return this.authClient.signIn.email({ email, password }, { headers })
      }

      this.authClient.signIn.social({
        provider: provider as "google" | "github" | "apple",
        callbackURL: runtime === "app" ? `${this.options.webURL}/login` : this.options.webURL,
      })
    }
  }
}

// copy from packages/internal/utils/src/ns.ts
const ns = "follow"
const getStorageNS = (key: string) => `${ns}:${key}`
