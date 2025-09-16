import type { ModuleAPIs } from "@follow-app/client-sdk"

export type GeneralMutationOptions = {
  onSuccess?: () => void
  onError?: (errorMessage: string) => void
}

export type GeneralQueryOptions = {
  enabled?: boolean
}

export type FollowAPI = ModuleAPIs
