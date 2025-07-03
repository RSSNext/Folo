import type { TrackerAdapter, TrackPayload } from "./base"

export class ProxyAdapter implements TrackerAdapter {
  private enabled = false
  constructor(
    private config: {
      enabled: boolean
      sender: (eventName: string, properties: Record<string, unknown>) => Promise<void>
    },
  ) {
    this.enabled = config.enabled
  }

  private globalProperties: Record<string, unknown> = {}

  initialize(): void {}
  clear(): void {
    this.globalProperties = {}
  }
  identify(): void {}
  setUserProperties(properties: Record<string, unknown>): void {
    this.globalProperties = {
      ...this.globalProperties,
      ...properties,
    }
  }

  async track(payload: TrackPayload): Promise<void> {
    if (!this.isEnabled()) return
    return this.config.sender(payload.eventName, {
      ...this.globalProperties,
      ...payload.properties,
    })
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
  getName(): string {
    return "proxy"
  }
}
