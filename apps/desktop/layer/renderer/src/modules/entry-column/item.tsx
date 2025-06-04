import type { FeedViewType } from "@follow/constants"
import type { FC } from "react"
import { memo } from "react"

import { useEntryTranslation } from "~/store/ai/hook"
import { useEntry } from "~/store/entry/hooks"

import { getItemComponentByView } from "./Items/getItemComponentByView"
import { EntryItemWrapper } from "./layouts/EntryItemWrapper"
import type { EntryListItemFC } from "./types"

interface EntryItemProps {
  entryId: string
  view?: number
}
const EntryItemImpl = memo(function EntryItemImpl({
  entryId,
  view,
}: {
  entryId: string
  view?: number
}) {
  const translation = useEntryTranslation({ entryId })

  const Item: EntryListItemFC = getItemComponentByView(view as FeedViewType)

  return (
    <EntryItemWrapper itemClassName={Item.wrapperClassName} entryId={entryId} view={view}>
      <Item entryId={entryId} translation={translation.data} />
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
