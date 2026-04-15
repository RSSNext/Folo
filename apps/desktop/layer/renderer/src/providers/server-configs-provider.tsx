import { useEffect } from "react"

import { setMASStoreVersion, setServerConfigs } from "~/atoms/server-configs"
import { syncServerShortcuts } from "~/atoms/settings/ai"
import { useMASStoreVersionQuery } from "~/queries/ota-versions"
import { useServerConfigsQuery } from "~/queries/server-configs"

export const ServerConfigsProvider = () => {
  const serverConfigs = useServerConfigsQuery()
  const masStoreVersion = useMASStoreVersionQuery()

  useEffect(() => {
    if (!serverConfigs) return
    setServerConfigs(serverConfigs)
    syncServerShortcuts(serverConfigs.AI_SHORTCUTS)
  }, [serverConfigs])

  useEffect(() => {
    if (masStoreVersion === undefined) return
    setMASStoreVersion(masStoreVersion)
  }, [masStoreVersion])

  return null
}
