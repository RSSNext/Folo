import type { GetHydrateData } from "@client/lib/helper"
import type { AuthProvider } from "@client/query/users"

import { createApiFetch } from "~/lib/api-client"
import { defineMetadata } from "~/meta-handler"

const getTypedProviders = async () => {
  const apiFetch = createApiFetch()
  const data = (await apiFetch("/better-auth/get-providers")) as Record<string, AuthProvider>

  return data
}

const meta = defineMetadata(async () => {
  const providers = await getTypedProviders()

  return [
    {
      type: "title",
      title: "Login",
    },
    {
      type: "hydrate",
      data: providers,
      path: "/login",
      key: `betterAuth`,
    },
  ] as const
})

export type LoginHydrateData = GetHydrateData<typeof meta>
export default meta
