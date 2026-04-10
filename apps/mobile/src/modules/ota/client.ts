export interface FetchStorePolicyInput {
  baseUrl: string
  product: string
  channel: string
  installedBinaryVersion: string
}

export interface StorePolicyResponse {
  action: string
  targetVersion?: string | null
  message?: string | null
}

export const fetchStorePolicy = async ({
  baseUrl,
  product,
  channel,
  installedBinaryVersion,
}: FetchStorePolicyInput): Promise<StorePolicyResponse> => {
  const requestUrl = new URL("/policy", baseUrl)
  requestUrl.searchParams.set("product", product)
  requestUrl.searchParams.set("channel", channel)
  requestUrl.searchParams.set("installedBinaryVersion", installedBinaryVersion)

  const response = await fetch(requestUrl.toString())
  if (!response.ok) {
    throw new Error(`Failed to fetch OTA policy (${response.status})`)
  }

  return (await response.json()) as StorePolicyResponse
}
