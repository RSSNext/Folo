import { withFeature } from "~/lib/features"

import {
  VideoItem as VideoItemAI,
  VideoItemStateLess as VideoItemAIStateLess,
} from "./video-item.ai"
import {
  VideoItem as VideoItemLegacy,
  VideoItemStateLess as VideoItemLegacyStateLess,
} from "./video-item.legacy"

export const VideoItem = withFeature("ai")(VideoItemAI, VideoItemLegacy)
export const VideoItemStateLess = withFeature("ai")(VideoItemAIStateLess, VideoItemLegacyStateLess)

export { VideoItemSkeleton } from "./video-item.ai"
