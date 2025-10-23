import { useEffect } from "react"

import { setServerConfigs } from "~/atoms/server-configs"
import { syncServerShortcuts } from "~/atoms/settings/ai"
import { useServerConfigsQuery } from "~/queries/server-configs"

export const ServerConfigsProvider = () => {
  const serverConfigs = useServerConfigsQuery()

  useEffect(() => {
    if (!serverConfigs) return
    setServerConfigs(serverConfigs)
    syncServerShortcuts(serverConfigs.AI_SHORTCUTS)
  }, [serverConfigs])

  return null
}
