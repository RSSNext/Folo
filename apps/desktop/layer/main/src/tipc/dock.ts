import { UNREAD_BACKGROUND_POLLING_INTERVAL } from "../constants/app"
import { apiClient } from "../lib/api-client"
import { setDockCount } from "../lib/dock"
import { sleep } from "../lib/utils"
import { t } from "./_instance"

const pollingMap = {
  unread: false,
}
export const dockRoute = {
  pollingUpdateUnreadCount: t.procedure.action(pollingUpdateUnreadCount),

  cancelPollingUpdateUnreadCount: t.procedure.action(cancelPollingUpdateUnreadCount),

  updateUnreadCount: t.procedure.action(async () => {
    await updateUnreadCount()
  }),
}

async function updateUnreadCount() {
  const res = await apiClient.reads["total-count"].$get()
  setDockCount(res.data.count)
}

export async function pollingUpdateUnreadCount() {
  if (pollingMap.unread) {
    return
  }

  pollingMap.unread = true
  while (pollingMap.unread) {
    await sleep(UNREAD_BACKGROUND_POLLING_INTERVAL)
    if (pollingMap.unread) {
      await updateUnreadCount()
    }
  }
}

export async function cancelPollingUpdateUnreadCount() {
  pollingMap.unread = false
}
