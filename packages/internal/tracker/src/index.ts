import { improvedTrackManager, TrackerPoints } from "./points"

export const setOpenPanelTracker =
  improvedTrackManager.setOpenPanelTracker.bind(improvedTrackManager)
export const setFirebaseTracker = improvedTrackManager.setFirebaseTracker.bind(improvedTrackManager)
export const setPostHogTracker = improvedTrackManager.setPostHogTracker.bind(improvedTrackManager)

export const tracker = new TrackerPoints()

export {
  FirebaseAdapter,
  type FirebaseAdapterConfig,
  type IdentifyPayload,
  OpenPanelAdapter,
  type OpenPanelAdapterConfig,
  PostHogAdapter,
  type PostHogAdapterConfig,
  type TrackerAdapter,
  type TrackPayload,
} from "./adapters"
export { TrackerManager, type TrackerManagerConfig } from "./manager"
export { improvedTrackManager, TrackerMapper, type TrackerPoints } from "./points"
