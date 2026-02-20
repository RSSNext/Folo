import { getUnreadAll } from "@follow/store/unread/getters"
import { unreadSyncService } from "@follow/store/unread/store"
import { whoami } from "@follow/store/user/getters"
import * as BackgroundTask from "expo-background-task"
import * as TaskManager from "expo-task-manager"

import { getUISettings } from "../atoms/settings/ui"
import { setBadgeCountAsyncWithPermission } from "../lib/permission"

const BACKGROUND_FETCH_TASK = "background-fetch"

// defineTask must be called at module load time (top level), not inside an
// async function, otherwise iOS may not find the handler when the background
// task fires and will crash with "No launch handler registered".
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
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

export async function initBackgroundTask() {
  return BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes
  })
}
