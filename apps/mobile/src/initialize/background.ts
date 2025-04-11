import * as BackgroundFetch from "expo-background-fetch"
import * as TaskManager from "expo-task-manager"

import { getUISettings } from "../atoms/settings/ui"
import { unreadSyncService } from "../store/unread/store"
import { whoami } from "../store/user/getters"

const BACKGROUND_FETCH_TASK = "background-fetch"

export async function initBackgroundFetch() {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    // const now = Date.now()
    // console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`)
    const user = whoami()
    const { showUnreadCountBadgeMobile } = getUISettings()
    if (!user || !showUnreadCountBadgeMobile) {
      return BackgroundFetch.BackgroundFetchResult.NoData
    }

    try {
      const res = await unreadSyncService.updateBadgeAtBackground()
      return res
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData
    } catch (err) {
      console.error(err)
      return BackgroundFetch.BackgroundFetchResult.Failed
    }
  })

  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
  })
}
