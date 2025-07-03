import type { FirebaseAnalyticsTypes } from "@react-native-firebase/analytics"
import type { PostHog } from "posthog-js"
import type PostHogReactNative from "posthog-react-native"

import { FirebaseAdapter, OpenPanelAdapter, PostHogAdapter } from "./adapters"
import { ProxyAdapter } from "./adapters/proxy"
import type { TrackerMapper } from "./enums"
import { TrackerManager } from "./manager"
import type { OpenPanel } from "./op"
import type { Optional, Tracker } from "./types"

class TrackManager extends TrackerManager {
  private trackFns: Tracker[] = []

  constructor() {
    super({
      enableBatchProcessing: false,
      enableErrorRetry: true,
      maxRetries: 2,
    })
  }

  setTrackFn(fn: Tracker) {
    this.trackFns.push(fn)

    return () => {
      this.trackFns = this.trackFns.filter((t) => t !== fn)
    }
  }

  getTrackFn(): Tracker {
    if (this.trackFns.length === 0 && this.getEnabledAdapters().length === 0) {
      console.error("[Tracker warn]: Track function not set")
    }
    return (code, properties) => {
      const legacyPromises = this.trackFns.map((fn) => fn(code, properties))
      const modernPromise = this.track(code as TrackerMapper, properties)
      return Promise.all([...legacyPromises, modernPromise])
    }
  }

  setOpenPanelTracker(op: Optional<OpenPanel, "setHeaders">) {
    const adapter = new OpenPanelAdapter({ instance: op })
    this.addAdapter(adapter)
  }

  setFirebaseTracker(
    tracker: Pick<FirebaseAnalyticsTypes.Module, "logEvent" | "setUserId" | "setUserProperties">,
  ) {
    const adapter = new FirebaseAdapter({ instance: tracker })
    this.addAdapter(adapter)
  }

  setPostHogTracker(posthog: PostHog | PostHogReactNative) {
    const adapter = new PostHogAdapter({ instance: posthog })
    this.addAdapter(adapter)
  }

  setProxyTracker(config: {
    enabled: boolean
    sender: (eventName: string, properties: Record<string, unknown>) => Promise<void>
  }) {
    const adapter = new ProxyAdapter({ enabled: config.enabled, sender: config.sender })
    this.addAdapter(adapter)
  }
}

export const trackManager = new TrackManager()
export const improvedTrackManager = trackManager // Alias for backward compatibility
