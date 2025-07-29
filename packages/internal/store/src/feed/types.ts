import type { FeedSchema } from "@follow/database/schemas/types"

export type FeedModel = FeedSchema & {
  type: "feed"
  nonce?: string
}
