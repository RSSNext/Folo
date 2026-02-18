import type {
  DistributionStatusPayload,
  GetLatestReleaseQuery,
  LatestReleasePayload,
} from "@follow-app/client-sdk"

import { apiClient } from "~/lib/api-client"

let cachedLatestRelease: LatestReleasePayload | null = null

export const getUpdateInfo = async (
  query: GetLatestReleaseQuery = {},
): Promise<LatestReleasePayload> => {
  const response = await apiClient.updates.getLatestRelease(query)
  cachedLatestRelease = response.data
  return cachedLatestRelease
}

export const getDistributionUpdateInfo = async (): Promise<DistributionStatusPayload | null> => {
  const distribution = process.mas ? "mas" : process.windowsStore ? "mss" : undefined
  if (!distribution) {
    return null
  }
  const response = await apiClient.updates.getDistributionStatus({ distribution })
  return response.data
}
