import { gt, valid } from "semver"

export interface OTAVersionsResponse {
  store?: {
    desktop?: {
      mas?: {
        version?: null | string
      }
    }
  }
}

const normalizeVersion = (version?: null | string) => {
  if (!version) {
    return null
  }

  return valid(version.trim())
}

export const getMASStoreVersionFromOTAVersions = (payload: OTAVersionsResponse) =>
  payload.store?.desktop?.mas?.version ?? null

export const isLocalMASVersionInReview = ({
  isMASBuild,
  localVersion,
  storeVersion,
}: {
  isMASBuild: boolean
  localVersion: string
  storeVersion?: null | string
}) => {
  if (!isMASBuild) {
    return false
  }

  const normalizedLocalVersion = normalizeVersion(localVersion)
  const normalizedStoreVersion = normalizeVersion(storeVersion)

  if (!normalizedLocalVersion || !normalizedStoreVersion) {
    return false
  }

  return gt(normalizedLocalVersion, normalizedStoreVersion)
}
