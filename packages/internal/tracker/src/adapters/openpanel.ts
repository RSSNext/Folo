import { TrackerMapper } from "../enums"
import type { OpenPanel } from "../op"
import type { Optional } from "../types"
import type { IdentifyPayload, TrackerAdapter, TrackPayload } from "./base"

export interface OpenPanelAdapterConfig {
  instance: Optional<OpenPanel, "setHeaders">
  enabled?: boolean
}

export class OpenPanelAdapter implements TrackerAdapter {
  private opInstance: Optional<OpenPanel, "setHeaders">
  private enabled: boolean

  constructor(config: OpenPanelAdapterConfig) {
    this.opInstance = config.instance
    this.enabled = config.enabled ?? true
  }

  initialize(): void {
    // OpenPanel is initialized when the instance is created
  }

  async track({ eventName, properties }: TrackPayload): Promise<void> {
    if (!this.isEnabled()) return

    try {
      // Handle special OpenPanel events based on the original event code
      const code = (properties as any)?.__code as TrackerMapper

      if (code !== undefined) {
        await this.handleSpecialEvents(code, eventName, properties)
      } else {
        await this.opInstance.track(eventName, properties)
      }
    } catch (error) {
      console.error(`[OpenPanel] Failed to track event "${eventName}":`, error)
    }
  }

  private async handleSpecialEvents(
    code: TrackerMapper,
    eventName: string,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    switch (code) {
      case TrackerMapper.Identify: {
        // Identify is handled separately, skip here
        break
      }
      default: {
        // For all other events, use the standard track method with the code
        await this.opInstance.track(eventName, { ...properties, __code: code })
      }
    }
  }

  async identify(payload: IdentifyPayload): Promise<void> {
    if (!this.isEnabled()) return

    try {
      await this.opInstance.identify({
        profileId: payload.id,
        email: payload.email ?? undefined,
        avatar: payload.image ?? undefined,
        lastName: payload.name ?? undefined,
        properties: {
          handle: payload.handle,
          name: payload.name,
        },
      })
    } catch (error) {
      console.error("[OpenPanel] Failed to identify user:", error)
    }
  }

  async setUserProperties(properties: Record<string, unknown>): Promise<void> {
    if (!this.isEnabled()) return

    try {
      this.opInstance.setGlobalProperties?.(properties)
    } catch (error) {
      console.error("[OpenPanel] Failed to set user properties:", error)
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled()) return

    try {
      this.opInstance.clear?.()
    } catch (error) {
      console.error("[OpenPanel] Failed to clear user data:", error)
    }
  }

  getName(): string {
    return "OpenPanel"
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}
