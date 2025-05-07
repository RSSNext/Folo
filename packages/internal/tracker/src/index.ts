import { TrackerPoints, trackManager } from "./points"

export const setOpenPanelTracker = trackManager.setOpenPanelTracker.bind(trackManager)
export const setFirebaseTracker = trackManager.setFirebaseTracker.bind(trackManager)

export const tracker = new TrackerPoints()

export { type TrackerPoints } from "./points"
export { TrackerMapper } from "./points"
