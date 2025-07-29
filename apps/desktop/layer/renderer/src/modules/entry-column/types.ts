import type {
  CombinedEntryModel,
  EntryModelSimple,
  FeedModel,
  FeedOrListRespModel,
} from "@follow/models/types"
import type { EntryTranslation } from "@follow/store/translation/types"
import type { FC } from "react"

export type UniversalItemProps = {
  entryId: string
  entryPreview?: CombinedEntryModel & {
    feeds: FeedOrListRespModel
    feedId: string
    inboxId: string
  }
  translation?: EntryTranslation
}

export type EntryListItemFC<P extends object = object> = FC<P & UniversalItemProps> & {
  wrapperClassName?: string
}

export type EntryItemStatelessProps = {
  feed: FeedModel
  entry: EntryModelSimple
  view?: number
}
