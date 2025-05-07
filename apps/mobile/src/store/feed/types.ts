import type { FeedSchema } from "@/src/database/schemas/types"

export type FeedModel = FeedSchema & {
  nonce?: string
}
