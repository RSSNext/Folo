import { IpcMethod, IpcService } from "electron-ipc-decorator"

import { UNREAD_BACKGROUND_POLLING_INTERVAL } from "../../constants/app"
import { apiClient } from "../../lib/api-client"
import { setDockCount } from "../../lib/dock"

class PollingManager {
  private abortController: AbortController | null = null
  private isPolling = false

  async startPolling(pollingFn: () => Promise<void>, interval: number): Promise<void> {
    if (this.isPolling) {
      return // Already polling, prevent duplicate instances
    }

    this.isPolling = true
    this.abortController = new AbortController()
    const { signal } = this.abortController

    try {
      while (!signal.aborted) {
        // A failed round, such as one right after waking up offline, only skips that round
        try {
          await pollingFn()
        } catch (error) {
          console.error("Polling error:", error)
        }

        // Use AbortSignal with sleep for proper cancellation
        await this.sleepWithAbortSignal(interval, signal)
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
      const onAbort = () => {
        clearTimeout(timeoutId)
        reject(new DOMException("Aborted", "AbortError"))
      }
      const timeoutId = setTimeout(() => {
        signal.removeEventListener("abort", onAbort)
        resolve()
      }, ms)

      signal.addEventListener("abort", onAbort, { once: true })
    })
  }
}

export class DockService extends IpcService {
  private unreadPollingManager = new PollingManager()

  static override readonly groupName = "dock"

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
    const res = await apiClient.reads.getTotalCount()

    setDockCount(res.data.count)
  }

  @IpcMethod()
  setDockBadge(count: number): void {
    setDockCount(count)
  }
}
