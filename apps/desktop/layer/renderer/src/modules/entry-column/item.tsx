import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useEntryTranslation, usePrefetchEntryTranslation } from "@follow/store/translation/hooks"
import type { FC } from "react"
import { memo } from "react"

import { useActionLanguage, useGeneralSettingKey } from "~/atoms/settings/general"
import { checkLanguage } from "~/lib/translate"

import { getItemComponentByView } from "./Items/getItemComponentByView"
import { EntryItemWrapper } from "./layouts/EntryItemWrapper"
import type { EntryListItemFC } from "./types"

interface EntryItemProps {
  entryId: string
  view: FeedViewType
}
const EntryItemImpl = memo(function EntryItemImpl({
  entryId,
  view,
}: {
  entryId: string
  view: FeedViewType
}) {
  const actionLanguage = useActionLanguage()
  const enableTranslation = useGeneralSettingKey("translation")
  const translation = useEntryTranslation(entryId, actionLanguage)
  usePrefetchEntryTranslation({
    entryIds: [entryId],
    checkLanguage,
    translation: enableTranslation,
    language: actionLanguage,
    withContent: view === FeedViewType.SocialMedia,
  })

  const Item: EntryListItemFC = getItemComponentByView(view)

  return (
    <EntryItemWrapper itemClassName={Item.wrapperClassName} entryId={entryId} view={view}>
      <Item entryId={entryId} translation={translation} />
    </EntryItemWrapper>
  )
})

export const EntryItem: FC<EntryItemProps> = memo(({ entryId, view }) => {
  const entry = useEntry(entryId, () => ({}))

  if (!entry) return null
  return <EntryItemImpl entryId={entryId} view={view} />
})

export const EntryVirtualListItem = ({
  ref,
  entryId,
  view,
  className,
  ...props
}: EntryItemProps &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement | null>
  }) => {
  const entry = useEntry(entryId, () => ({}))

  if (!entry) return <div ref={ref} {...props} style={undefined} />

  return (
    <div className="absolute left-0 top-0 w-full will-change-transform" ref={ref} {...props}>
      <EntryItemImpl entryId={entryId} view={view} />
    </div>
  )
}
