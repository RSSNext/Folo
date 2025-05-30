import { createAtomHooks } from "@follow/utils/jotai"
import { atom } from "jotai"

export const [, , useFeedBoostMap, , getFeedBoostMap, setFeedBoostMap] = createAtomHooks(
  atom<Record<string, boolean>>({}),
)

export const updateFeedBoostStatus = (feedId: string, isBoosted: boolean) => {
  const prev = getFeedBoostMap()
  setFeedBoostMap({ ...prev, [feedId]: isBoosted })
}
