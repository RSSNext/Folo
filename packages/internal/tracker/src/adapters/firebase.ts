import type { FirebaseAnalyticsTypes } from "@react-native-firebase/analytics"

import { TrackerMapper } from "../enums"
import type { IdentifyPayload, TrackerAdapter, TrackPayload } from "./base"

export interface FirebaseAdapterConfig {
  instance: Pick<FirebaseAnalyticsTypes.Module, "logEvent" | "setUserId" | "setUserProperties">
  enabled?: boolean
}

export class FirebaseAdapter implements TrackerAdapter {
  private firebaseInstance: Pick<
    FirebaseAnalyticsTypes.Module,
    "logEvent" | "setUserId" | "setUserProperties"
  >
  private enabled: boolean

  constructor(config: FirebaseAdapterConfig) {
    this.firebaseInstance = config.instance
    this.enabled = config.enabled ?? true
  }

  initialize(): void {
    // Firebase is initialized when the instance is passed
  }

  async track({ eventName, properties }: TrackPayload): Promise<void> {
    if (!this.isEnabled()) return

    try {
      // Handle special Firebase events based on the original event code
      const code = (properties as any)?.__code as TrackerMapper

      if (code !== undefined) {
        await this.handleSpecialEvents(code, properties)
      } else {
        await this.firebaseInstance.logEvent(eventName, properties)
      }
    } catch (error) {
      console.error(`[Firebase] Failed to track event "${eventName}":`, error)
    }
  }

  private async handleSpecialEvents(
    code: TrackerMapper,
    properties?: Record<string, unknown>,
  ): Promise<void> {
    switch (code) {
      case TrackerMapper.Identify: {
        // Identify is handled separately, skip here
        break
      }
      case TrackerMapper.OnBoarding: {
        if (properties?.step === 0) {
          await this.firebaseInstance.logEvent("tutorial_begin")
        } else if (properties?.done) {
          await this.firebaseInstance.logEvent("tutorial_complete")
        }
        break
      }
      case TrackerMapper.NavigateEntry: {
        await this.firebaseInstance.logEvent("select_content", {
          content_type: "entry",
          item_id: `${properties?.feedId}/${properties?.entryId}`,
        })
        break
      }
      case TrackerMapper.UserLogin: {
        await this.firebaseInstance.logEvent("login", {
          method: properties?.type as string,
        })
        break
      }
      case TrackerMapper.Register: {
        await this.firebaseInstance.logEvent("sign_up", {
          method: properties?.type as string,
        })
        break
      }
      case TrackerMapper.Subscribe: {
        let group_id
        if (properties?.listId) {
          group_id = `list/${properties.listId}/${properties.view}`
        } else if (properties?.feedId) {
          group_id = `feed/${properties.feedId}/${properties.view}`
        }
        if (group_id) {
          await this.firebaseInstance.logEvent("join_group", {
            group_id,
          })
        }
        break
      }
      case TrackerMapper.BoostSent: {
        await this.firebaseInstance.logEvent("purchase", {
          currency: "POWER",
          value: properties?.amount,
          items: `feed/${properties?.feedId}`,
          transaction_id: properties?.transactionId,
        })
        break
      }
      case TrackerMapper.DailyRewardClaimed: {
        await this.firebaseInstance.logEvent("earn_virtual_currency", {
          virtual_currency_name: "POWER",
        })
        break
      }
      case TrackerMapper.TipSent: {
        await this.firebaseInstance.logEvent("purchase", {
          currency: "POWER",
          value: properties?.amount,
          items: `entry/${properties?.entryId}`,
          transaction_id: properties?.transactionId,
        })
        break
      }
      default: {
        // For other events, use the event name directly
        const eventName = (properties?.__eventName as string) || "unknown_event"
        await this.firebaseInstance.logEvent(eventName, properties)
      }
    }
  }

  async identify(payload: IdentifyPayload): Promise<void> {
    if (!this.isEnabled()) return

    try {
      await this.firebaseInstance.setUserId(payload.id)
      await this.firebaseInstance.setUserProperties({
        email: payload.email ?? null,
        name: payload.name ?? null,
        image: payload.image ?? null,
        handle: payload.handle ?? null,
      })
    } catch (error) {
      console.error("[Firebase] Failed to identify user:", error)
    }
  }

  async setUserProperties(properties: Record<string, unknown>): Promise<void> {
    if (!this.isEnabled()) return

    try {
      // Convert properties to Firebase's expected format
      const firebaseProperties: Record<string, string | null> = {}
      for (const [key, value] of Object.entries(properties)) {
        firebaseProperties[key] = value === null || value === undefined ? null : String(value)
      }
      await this.firebaseInstance.setUserProperties(firebaseProperties)
    } catch (error) {
      console.error("[Firebase] Failed to set user properties:", error)
    }
  }

  async clear(): Promise<void> {
    if (!this.isEnabled()) return

    try {
      await this.firebaseInstance.setUserId(null)
      await this.firebaseInstance.setUserProperties({})
    } catch (error) {
      console.error("[Firebase] Failed to clear user data:", error)
    }
  }

  getName(): string {
    return "Firebase"
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
}
