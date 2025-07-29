import type { CombinedEntryModel, FeedOrListRespModel } from "@follow/models/types"

export type UniversalItemProps = {
  entryId: string
  entryPreview?: CombinedEntryModel & {
    feeds: FeedOrListRespModel
    feedId: string
  }
}
