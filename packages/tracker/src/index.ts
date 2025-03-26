import { TrackerPoints, trackManager } from "./points"

export const setOpenPanelTracker = trackManager.setTrackFn.bind(trackManager)

export const tracker = new TrackerPoints()

export { type TrackerPoints } from "./points"
export { TrackerMapper } from "./points"

///// OpenPanel Utils

type Nullable<T> = T | null | undefined

export const identifyUserOpenPanel = (
  user: {
    id: string
    email?: Nullable<string>
    name?: Nullable<string>
    handle?: Nullable<string>
    image?: Nullable<string>
  },
  identifyFn: (...args: any[]) => any,
) => {
  identifyFn({
    profileId: user.id,
    email: user.email!,
    avatar: user.image ?? undefined,
    lastName: user.name!,
    properties: {
      handle: user.handle,
      name: user.name,
    },
  })
}
