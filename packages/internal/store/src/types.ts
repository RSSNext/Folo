import type { AuthClient } from "@follow/shared/auth"
import type { AppType } from "@follow/shared/hono"
import type { hc } from "hono/client"

type APIClient = ReturnType<typeof hc<AppType>>

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
