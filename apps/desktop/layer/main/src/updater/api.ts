import type { GetLatestReleaseQuery, LatestReleasePayload } from "@follow-app/client-sdk"

import { apiClient } from "~/lib/api-client"

let cachedLatestRelease: LatestReleasePayload | null = null

export const getUpdateInfo = async (
  query: GetLatestReleaseQuery = {},
): Promise<LatestReleasePayload> => {
  const response = await apiClient.updates.getLatestRelease(query)
  cachedLatestRelease = response.data
  return cachedLatestRelease
}

export const getCachedUpdateInfo = () => cachedLatestRelease
