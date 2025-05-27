import type { AppType } from "@follow/shared"
import type { authPlugins } from "@follow/shared/hono"
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins"
import type { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/types"
import type { hc } from "hono/client"

type APIClient = ReturnType<typeof hc<AppType>>

type AuthPlugin = (typeof authPlugins)[number]

// eslint-disable-next-line unused-imports/no-unused-vars
const serverPlugins = [
  {
    id: "customGetProviders",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "customGetProviders" }>,
  },
  {
    id: "getAccountInfo",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "getAccountInfo" }>,
  },
  {
    id: "oneTimeToken",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "oneTimeToken" }>,
  },
  {
    id: "getProviders",
    $InferServerPlugin: {} as Extract<AuthPlugin, { id: "getProviders" }>,
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
] satisfies BetterAuthClientPlugin[]
type AuthClient = ReturnType<
  typeof createAuthClient<{
    plugins: typeof serverPlugins
  }>
>

declare global {
  const apiClient: APIClient
  const authClient: AuthClient
}

export type GeneralMutationOptions = {
  onSuccess?: () => void
  onError?: (errorMessage: string) => void
}

export type GeneralQueryOptions = {
  enabled?: boolean
}
