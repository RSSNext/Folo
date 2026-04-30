import { useQuery } from "@tanstack/react-query"
import { ofetch } from "ofetch"

import type { OTAVersionsResponse } from "~/lib/mas-review"
import { getMASStoreVersionFromOTAVersions } from "~/lib/mas-review"

const OTA_VERSIONS_URL = "https://ota.folo.is/versions"

const isMASBuild = () => typeof process !== "undefined" && !!process.mas

export const useMASStoreVersionQuery = () => {
  const { data } = useQuery({
    queryKey: ["ota-versions", "store", "desktop", "mas"],
    queryFn: async () => {
      const response = await ofetch<OTAVersionsResponse>(OTA_VERSIONS_URL, {
        cache: "no-store",
      })

      return getMASStoreVersionFromOTAVersions(response)
    },
    enabled: isMASBuild(),
  })

  return data
}
