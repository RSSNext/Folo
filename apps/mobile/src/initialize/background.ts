import { getUnreadAll } from "@follow/store/unread/getters"
import { unreadSyncService } from "@follow/store/unread/store"
import { whoami } from "@follow/store/user/getters"
import * as BackgroundTask from "expo-background-task"
import * as TaskManager from "expo-task-manager"

import { getUISettings } from "../atoms/settings/ui"
import { setBadgeCountAsyncWithPermission } from "../lib/permission"

const BACKGROUND_FETCH_TASK = "background-fetch"

export async function initBackgroundTask() {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    // const now = Date.now()
    // console.log(`Got background fetch call at date: ${new Date(now).toISOString()}`)
    const user = whoami()
    const { showUnreadCountBadgeMobile } = getUISettings()
    if (!user || !showUnreadCountBadgeMobile) {
      return BackgroundTask.BackgroundTaskResult.Success
    }

    try {
      await unreadSyncService.resetFromRemote()
      const allUnreadCount = getUnreadAll()
      await setBadgeCountAsyncWithPermission(allUnreadCount)
      return BackgroundTask.BackgroundTaskResult.Success
    } catch (err) {
      console.error(err)
      return BackgroundTask.BackgroundTaskResult.Failed
    }
  })

  return BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
  })
}
