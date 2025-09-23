import { withFeature } from "~/lib/features"

import {
  PictureItem as PictureItemAI,
  PictureWaterFallItem as PictureWaterFallItemAI,
} from "./picture-item.ai"
import {
  PictureItem as PictureItemLegacy,
  PictureWaterFallItem as PictureWaterFallItemLegacy,
} from "./picture-item.legacy"

export const PictureItem = withFeature("ai")(PictureItemAI, PictureItemLegacy)
export const PictureWaterFallItem = withFeature("ai")(
  PictureWaterFallItemAI,
  PictureWaterFallItemLegacy,
)

export { PictureItemSkeleton } from "./picture-item-skeleton"
