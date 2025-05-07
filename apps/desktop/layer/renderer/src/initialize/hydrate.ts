import { sleep } from "@follow/utils/utils"

import { initializeDefaultGeneralSettings } from "~/atoms/settings/general"
import { initializeDefaultIntegrationSettings } from "~/atoms/settings/integration"
import { initializeDefaultUISettings } from "~/atoms/settings/ui"
import { appLog } from "~/lib/log"
import { EntryService, FeedService, FeedUnreadService, SubscriptionService } from "~/services"
import { InboxService } from "~/services/inbox"
import type { Hydratable } from "~/services/interface"
import { ListService } from "~/services/list"

export const setHydrated = (v: boolean) => {
  window.__dbIsReady = v
}

export const hydrateDatabaseToStore = async () => {
  async function hydrate() {
    const now = Date.now()

    const hydrates: Hydratable[] = [
      FeedService,
      SubscriptionService,
      FeedUnreadService,
      EntryService,
      ListService,
      InboxService,
    ]
    await Promise.all(hydrates.map((h) => h.hydrate()))

    window.__dbIsReady = true
    const costTime = Date.now() - now

    return costTime
  }
  return Promise.race([hydrate(), sleep(1000).then(() => 10e10)]).then((result) => {
    if (result === 10e10) {
      appLog("Hydrate data timeout")
    }
    return result
  })
}

export const hydrateSettings = () => {
  initializeDefaultUISettings()
  initializeDefaultGeneralSettings()
  initializeDefaultIntegrationSettings()
}
