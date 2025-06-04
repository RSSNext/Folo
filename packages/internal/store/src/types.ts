import type { AppType } from "@follow/shared/hono"
import type { hc } from "hono/client"

export type APIClient = ReturnType<typeof hc<AppType>>

export type GeneralMutationOptions = {
  onSuccess?: () => void
  onError?: (errorMessage: string) => void
}

export type GeneralQueryOptions = {
  enabled?: boolean
}
