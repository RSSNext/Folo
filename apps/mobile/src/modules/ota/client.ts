import { z } from "zod"

export interface FetchStorePolicyInput {
  baseUrl: string
  product: string
  platform: "ios" | "android"
  channel: string
  installedBinaryVersion: string
}

const storePolicySchema = z.object({
  action: z.enum(["none", "prompt", "block"]),
  targetVersion: z.string().nullable(),
  message: z.string().nullable(),
})

export interface StorePolicyResponse {
  action: z.infer<typeof storePolicySchema>["action"]
  targetVersion: string | null
  message: string | null
}

export const fetchStorePolicy = async ({
  baseUrl,
  product,
  platform,
  channel,
  installedBinaryVersion,
}: FetchStorePolicyInput): Promise<StorePolicyResponse> => {
  const requestUrl = new URL("/policy", baseUrl)
  requestUrl.searchParams.set("product", product)
  requestUrl.searchParams.set("platform", platform)
  requestUrl.searchParams.set("channel", channel)
  requestUrl.searchParams.set("installedBinaryVersion", installedBinaryVersion)

  const response = await fetch(requestUrl.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch OTA policy (${response.status})`)
  }

  const payload = await response.json()
  const result = storePolicySchema.safeParse(payload)
  if (!result.success) {
    throw new Error("Invalid OTA policy response")
  }

  return result.data
}
