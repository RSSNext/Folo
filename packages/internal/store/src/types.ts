import type { AppType } from "@follow/shared"
import type { hc } from "hono/client"

type APIClient = ReturnType<typeof hc<AppType>>

declare global {
  const apiClient: APIClient
}
