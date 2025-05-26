import type { FeedSchema } from "@follow/database/src/schemas/types"

import { useFeedStore } from "./store"

const get = useFeedStore.getState
export const getFeed = (id: string): FeedSchema | null => {
  return get().feeds[id] || null
}
