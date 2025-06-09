import type { PostHog } from "posthog-js"

import type { IdentifyPayload, TrackerAdapter, TrackPayload } from "./base"

export interface PostHogAdapterConfig {
  instance: PostHog
  enabled?: boolean
}

export class PostHogAdapter implements TrackerAdapter {
  private posthogInstance: PostHog
  private enabled: boolean

  constructor(config: PostHogAdapterConfig) {
    this.posthogInstance = config.instance
    this.enabled = config.enabled ?? true
  }

  initialize(): void {
    // PostHog is initialized when the instance is passed
  }

  async track({ eventName, properties }: TrackPayload): Promise<void> {
    if (!this.isEnabled()) return

    try {
      this.posthogInstance.capture(eventName, properties)
    } catch (error) {
      console.error(`[PostHog] Failed to track event "${eventName}":`, error)
    }
  }

  async identify(payload: IdentifyPayload): Promise<void> {
    if (!this.isEnabled()) return

    try {
      this.posthogInstance.identify(payload.id, {
        email: payload.email,
        name: payload.name,
        avatar: payload.image,
        handle: payload.handle,
      })
    } catch (error) {
      console.error("[PostHog] Failed to identify user:", error)
    }
  }

  async setUserProperties(properties: Record<string, unknown>): Promise<void> {
    if (!this.isEnabled()) return

    try {
      this.posthogInstance.setPersonProperties(properties)
    } catch (error) {
      console.error("[PostHog] Failed to set user properties:", error)
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled()) return

    try {
      this.posthogInstance.reset()
    } catch (error) {
      console.error("[PostHog] Failed to clear user data:", error)
    }
  }

  getName(): string {
    return "PostHog"
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}
