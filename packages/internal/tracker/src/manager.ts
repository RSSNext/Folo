import type { IdentifyPayload, TrackerAdapter, TrackPayload } from "./adapters"
import type { TrackerMapper } from "./points"
import { CodeToTrackerName } from "./points"

export interface TrackerManagerConfig {
  enableBatchProcessing?: boolean
  batchSize?: number
  batchTimeout?: number
  enableErrorRetry?: boolean
  maxRetries?: number
}

export class TrackerManager {
  private adapters = new Map<string, TrackerAdapter>()
  private config: TrackerManagerConfig
  private batchQueue: Array<{ adapter: TrackerAdapter; payload: TrackPayload }> = []
  private batchTimer?: NodeJS.Timeout

  constructor(config: TrackerManagerConfig = {}) {
    this.config = {
      enableBatchProcessing: false,
      batchSize: 10,
      batchTimeout: 5000,
      enableErrorRetry: false,
      maxRetries: 3,
      ...config,
    }
  }

  /**
   * Add a tracker adapter
   */
  addAdapter(adapter: TrackerAdapter): void {
    if (this.adapters.has(adapter.getName())) {
      console.warn(`[TrackerManager] Adapter "${adapter.getName()}" already exists. Replacing...`)
    }

    this.adapters.set(adapter.getName(), adapter)

    try {
      adapter.initialize()
      console.info(`[TrackerManager] Initialized adapter: ${adapter.getName()}`)
    } catch (error) {
      console.error(`[TrackerManager] Failed to initialize adapter "${adapter.getName()}":`, error)
    }
  }

  /**
   * Remove a tracker adapter
   */
  removeAdapter(name: string): boolean {
    return this.adapters.delete(name)
  }

  /**
   * Get a specific adapter
   */
  getAdapter(name: string): TrackerAdapter | undefined {
    return this.adapters.get(name)
  }

  /**
   * Get all enabled adapters
   */
  getEnabledAdapters(): TrackerAdapter[] {
    return Array.from(this.adapters.values()).filter((adapter) => adapter.isEnabled())
  }

  /**
   * Track an event across all enabled adapters
   */
  async track(code: TrackerMapper, properties?: Record<string, unknown>): Promise<void> {
    const eventName = CodeToTrackerName(code)
    // Include both the code and event name in properties for adapter access
    const enhancedProperties = {
      ...properties,
      __code: code,
      __eventName: eventName,
    }
    const payload: TrackPayload = { eventName, properties: enhancedProperties }
    const enabledAdapters = this.getEnabledAdapters()

    if (enabledAdapters.length === 0) {
      console.warn("[TrackerManager] No enabled adapters found for tracking")
      return
    }

    if (this.config.enableBatchProcessing) {
      this.addToBatch(enabledAdapters, payload)
      return
    }

    await this.executeTrackingForAdapters(enabledAdapters, payload)
  }

  /**
   * Identify a user across all enabled adapters
   */
  async identify(payload: IdentifyPayload): Promise<void> {
    const enabledAdapters = this.getEnabledAdapters()

    if (enabledAdapters.length === 0) {
      console.warn("[TrackerManager] No enabled adapters found for identification")
      return
    }

    const promises = enabledAdapters.map(async (adapter) => {
      try {
        await Promise.resolve(adapter.identify(payload))
      } catch (error) {
        console.error(
          `[TrackerManager] Failed to identify user with adapter "${adapter.getName()}":`,
          error,
        )

        if (this.config.enableErrorRetry) {
          await this.retryOperation(
            () => Promise.resolve(adapter.identify(payload)),
            adapter.getName(),
          )
        }
      }
    })

    await Promise.allSettled([
      ...promises,
      this.appendUserProperties({
        email: payload.email ?? null,
        name: payload.name ?? null,
        image: payload.image ?? null,
        handle: payload.handle ?? null,
      }),
    ])
  }

  private managedUserProperties: Record<string, unknown> = {}
  private getUserProperties(): Record<string, unknown> {
    return this.managedUserProperties
  }
  /**
   * Set user properties across all enabled adapters
   */
  async setUserProperties(properties: Record<string, unknown>): Promise<void> {
    this.managedUserProperties = properties

    const enabledAdapters = this.getEnabledAdapters()

    if (enabledAdapters.length === 0) {
      console.warn("[TrackerManager] No enabled adapters found for setting user properties")
      return
    }

    const promises = enabledAdapters.map(async (adapter) => {
      try {
        await Promise.resolve(adapter.setUserProperties(properties))
      } catch (error) {
        console.error(
          `[TrackerManager] Failed to set user properties with adapter "${adapter.getName()}":`,
          error,
        )

        if (this.config.enableErrorRetry) {
          await this.retryOperation(
            () => Promise.resolve(adapter.setUserProperties(properties)),
            adapter.getName(),
          )
        }
      }
    })

    await Promise.allSettled(promises)
  }

  async appendUserProperties(properties: Record<string, unknown>): Promise<void> {
    const newProperties = {
      ...this.managedUserProperties,
      ...properties,
    }
    await this.setUserProperties(newProperties)
  }

  /**
   * Clear user data across all enabled adapters
   */
  async clear(): Promise<void> {
    const enabledAdapters = this.getEnabledAdapters()

    const promises = enabledAdapters.map(async (adapter) => {
      try {
        await Promise.resolve(adapter.clear())
      } catch (error) {
        console.error(
          `[TrackerManager] Failed to clear user data with adapter "${adapter.getName()}":`,
          error,
        )
      }
    })

    await Promise.allSettled([...promises, this.setUserProperties({})])
  }

  /**
   * Flush any pending batch operations
   */
  async flush(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }

    if (this.batchQueue.length > 0) {
      await this.processBatch()
    }
  }

  /**
   * Get manager statistics
   */
  getStats(): {
    totalAdapters: number
    enabledAdapters: number
    adapterNames: string[]
    queueSize: number
  } {
    return {
      totalAdapters: this.adapters.size,
      enabledAdapters: this.getEnabledAdapters().length,
      adapterNames: Array.from(this.adapters.keys()),
      queueSize: this.batchQueue.length,
    }
  }

  private addToBatch(adapters: TrackerAdapter[], payload: TrackPayload): void {
    adapters.forEach((adapter) => {
      this.batchQueue.push({ adapter, payload })
    })

    if (this.batchQueue.length >= this.config.batchSize!) {
      this.processBatch()
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch()
      }, this.config.batchTimeout!)
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = undefined
    }

    const currentBatch = this.batchQueue.splice(0, this.config.batchSize!)

    if (currentBatch.length === 0) return

    const promises = currentBatch.map(({ adapter, payload }) => {
      return this.executeTrackingForAdapter(adapter, payload)
    })

    await Promise.allSettled(promises)
  }

  private async executeTrackingForAdapters(
    adapters: TrackerAdapter[],
    payload: TrackPayload,
  ): Promise<void> {
    const promises = adapters.map((adapter) => this.executeTrackingForAdapter(adapter, payload))
    await Promise.allSettled(promises)
  }

  private async executeTrackingForAdapter(
    adapter: TrackerAdapter,
    payload: TrackPayload,
  ): Promise<void> {
    try {
      await Promise.resolve(adapter.track(payload))
    } catch (error) {
      console.error(
        `[TrackerManager] Failed to track event with adapter "${adapter.getName()}":`,
        error,
      )

      if (this.config.enableErrorRetry) {
        await this.retryOperation(() => Promise.resolve(adapter.track(payload)), adapter.getName())
      }
    }
  }

  private async retryOperation(operation: () => Promise<void>, adapterName: string): Promise<void> {
    let attempts = 0
    const maxRetries = this.config.maxRetries!

    while (attempts < maxRetries) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts))) // Exponential backoff
        await operation()
        return
      } catch (error) {
        attempts++
        if (attempts >= maxRetries) {
          console.error(
            `[TrackerManager] Failed to retry operation for adapter "${adapterName}" after ${maxRetries} attempts:`,
            error,
          )
        }
      }
    }
  }
}
