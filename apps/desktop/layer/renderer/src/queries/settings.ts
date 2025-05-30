import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"

export const settings = {
  get: () => defineQuery(["settings"], async () => await apiClient.settings.$get({ query: {} })),
}
