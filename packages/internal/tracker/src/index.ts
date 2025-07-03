import { improvedTrackManager } from "./track-manager"
import { TrackerPoints } from "./tracker-points"

export const setOpenPanelTracker =
  improvedTrackManager.setOpenPanelTracker.bind(improvedTrackManager)
export const setFirebaseTracker = improvedTrackManager.setFirebaseTracker.bind(improvedTrackManager)
export const setPostHogTracker = improvedTrackManager.setPostHogTracker.bind(improvedTrackManager)
export const setProxyTracker = improvedTrackManager.setProxyTracker.bind(improvedTrackManager)

export const tracker = new TrackerPoints()

export {
  FirebaseAdapter,
  type FirebaseAdapterConfig,
  type IdentifyPayload,
  OpenPanelAdapter,
  type OpenPanelAdapterConfig,
  PostHogAdapter,
  type PostHogAdapterConfig,
  ProxyAdapter,
  type TrackerAdapter,
  type TrackPayload,
} from "./adapters"
export { TrackerManager, type TrackerManagerConfig } from "./manager"
export { improvedTrackManager, trackManager } from "./track-manager"
export { type AllTrackers, TrackerPoints } from "./tracker-points"
