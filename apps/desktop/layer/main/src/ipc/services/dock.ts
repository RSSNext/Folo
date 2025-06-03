import { UNREAD_BACKGROUND_POLLING_INTERVAL } from "../../constants/app"
import { apiClient } from "../../lib/api-client"
import { setDockCount } from "../../lib/dock"
import { sleep } from "../../lib/utils"
import type { IpcContext } from "../base"
import { IpcService } from "../base"

const pollingMap = {
  unread: false,
}

export class DockService extends IpcService {
  constructor() {
    super("dock")
  }

  protected registerMethods(): void {
    this.registerMethod("pollingUpdateUnreadCount", this.pollingUpdateUnreadCount.bind(this))
    this.registerMethod(
      "cancelPollingUpdateUnreadCount",
      this.cancelPollingUpdateUnreadCount.bind(this),
    )
    this.registerMethod("updateUnreadCount", this.updateUnreadCount.bind(this))
  }

  async pollingUpdateUnreadCount(_context: IpcContext): Promise<void> {
    if (pollingMap.unread) {
      return
    }

    pollingMap.unread = true
    while (pollingMap.unread) {
      await sleep(UNREAD_BACKGROUND_POLLING_INTERVAL)
      if (pollingMap.unread) {
        await this.updateUnreadCount(_context)
      }
    }
  }

  async cancelPollingUpdateUnreadCount(_context: IpcContext): Promise<void> {
    pollingMap.unread = false
  }

  async updateUnreadCount(_context: IpcContext): Promise<void> {
    const res = await apiClient.reads["total-count"].$get()
    setDockCount(res.data.count)
  }
}
