import type { FeedModel } from "@follow/store/feed/types"
import type { EntryTranslation } from "@follow/store/translation/types"
import type { ParsedEntry } from "@follow-app/client-sdk"
import type { FC } from "react"

export type UniversalItemProps = {
  entryId: string
  translation?: EntryTranslation
  currentFeedTitle?: string
}

export type EntryListItemFC<P extends object = object> = FC<P & UniversalItemProps> & {
  wrapperClassName?: string
}

export type EntryItemStatelessProps = {
  feed: FeedModel
  entry: ParsedEntry
  view?: number
}
