import { UNREAD_BACKGROUND_POLLING_INTERVAL } from "../../constants/app"
import { apiClient } from "../../lib/api-client"
import { setDockCount } from "../../lib/dock"
import { sleep } from "../../lib/utils"
import { IpcMethod, IpcService } from "../base"

const pollingMap = {
  unread: false,
}

export class DockService extends IpcService {
  constructor() {
    super("dock")
  }

  @IpcMethod()
  async pollingUpdateUnreadCount(): Promise<void> {
    if (pollingMap.unread) {
      return
    }

    pollingMap.unread = true
    while (pollingMap.unread) {
      await sleep(UNREAD_BACKGROUND_POLLING_INTERVAL)
      if (pollingMap.unread) {
        await this.updateUnreadCount()
      }
    }
  }

  @IpcMethod()
  async cancelPollingUpdateUnreadCount(): Promise<void> {
    pollingMap.unread = false
  }

  @IpcMethod()
  async updateUnreadCount(): Promise<void> {
    const res = await apiClient.reads["total-count"].$get()
    setDockCount(res.data.count)
  }
}
