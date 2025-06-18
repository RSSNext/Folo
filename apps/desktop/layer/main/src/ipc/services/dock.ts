import { UNREAD_BACKGROUND_POLLING_INTERVAL } from "../../constants/app"
import { apiClient } from "../../lib/api-client"
import { setDockCount } from "../../lib/dock"
import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

class PollingManager {
  private abortController: AbortController | null = null
  private isPolling = false

  async startPolling(pollingFn: () => Promise<void>, interval: number): Promise<void> {
    if (this.isPolling) {
      return // Already polling, prevent duplicate instances
    }

    this.isPolling = true
    this.abortController = new AbortController()

    try {
      while (!this.abortController.signal.aborted) {
        await pollingFn()

        // Use AbortSignal with sleep for proper cancellation
        await this.sleepWithAbortSignal(interval, this.abortController.signal)
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Polling error:", error)
      }
    } finally {
      this.isPolling = false
      this.abortController = null
    }
  }

  stopPolling(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  get active(): boolean {
    return this.isPolling
  }

  private async sleepWithAbortSignal(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms)

      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId)
        reject(new DOMException("Aborted", "AbortError"))
      })
    })
  }
}

export class DockService extends IpcService {
  private unreadPollingManager = new PollingManager()

  constructor() {
    super("dock")
  }

  @IpcMethod()
  async pollingUpdateUnreadCount(): Promise<void> {
    await this.unreadPollingManager.startPolling(
      () => this.updateUnreadCount(),
      UNREAD_BACKGROUND_POLLING_INTERVAL,
    )
  }

  @IpcMethod()
  async cancelPollingUpdateUnreadCount(): Promise<void> {
    this.unreadPollingManager.stopPolling()
  }

  @IpcMethod()
  async updateUnreadCount(): Promise<void> {
    const res = await apiClient.reads["total-count"].$get()
    setDockCount(res.data.count)
  }

  @IpcMethod()
  setDockBadge(_context: IpcContext, count: number): void {
    setDockCount(count)
  }
}
