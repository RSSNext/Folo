import { FeedViewType } from "@follow/constants"
import { useHasEntry } from "@follow/store/entry/hooks"
import { useEntryTranslation, usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { FC } from "react"
import { memo } from "react"

import { useActionLanguage, useGeneralSettingKey } from "~/atoms/settings/general"

import { getItemComponentByView } from "./Items/getItemComponentByView"
import { EntryItemWrapper } from "./layouts/EntryItemWrapper"
import type { EntryListItemFC } from "./types"

interface EntryItemProps {
  entryId: string
  view: FeedViewType
  currentFeedTitle?: string
}
const EntryItemImpl = memo(function EntryItemImpl({
  entryId,
  view,
  currentFeedTitle,
}: EntryItemProps) {
  const enableTranslation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  const translation = useEntryTranslation({
    entryId,
    language: actionLanguage,
    setting: enableTranslation,
  })
  usePrefetchEntryTranslation({
    entryIds: [entryId],
    setting: enableTranslation,
    language: actionLanguage,
    withContent: view === FeedViewType.SocialMedia,
  })

  const Item: EntryListItemFC = getItemComponentByView(view)

  return (
    <EntryItemWrapper itemClassName={Item.wrapperClassName} entryId={entryId} view={view}>
      <Item entryId={entryId} translation={translation} currentFeedTitle={currentFeedTitle} />
    </EntryItemWrapper>
  )
})

export const EntryItem: FC<EntryItemProps> = memo(({ entryId, view, currentFeedTitle }) => {
  const hasEntry = useHasEntry(entryId)

  if (!hasEntry) return null
  return <EntryItemImpl entryId={entryId} view={view} currentFeedTitle={currentFeedTitle} />
})

export const EntryVirtualListItem = ({
  ref,
  entryId,
  view,
  className,
  currentFeedTitle,
  ...props
}: EntryItemProps &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement | null>
  }) => {
  const hasEntry = useHasEntry(entryId)

  if (!hasEntry) return <div ref={ref} {...props} style={undefined} />

  return (
    <div className="absolute left-0 top-0 w-full will-change-transform" ref={ref} {...props}>
      <EntryItemImpl entryId={entryId} view={view} currentFeedTitle={currentFeedTitle} />
    </div>
  )
}
