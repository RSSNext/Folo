import type { FeedSchema } from "@follow/database/src/schemas/types"

export type FeedModel = FeedSchema & {
  nonce?: string
}
