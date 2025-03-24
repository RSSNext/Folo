import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import type { FC } from "react"
import { memo } from "react"

import { useActionLanguage } from "~/atoms/settings/general"
import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"
import type { FlatEntryModel } from "~/store/entry"
import { useEntry } from "~/store/entry/hooks"

import { getItemComponentByView, getSkeletonItemComponentByView } from "./Items"
import { EntryItemWrapper } from "./layouts/EntryItemWrapper"
import { girdClassNames } from "./styles"
import type { EntryListItemFC } from "./types"

interface EntryItemProps {
  entryId: string
  view?: number
}
function EntryItemImpl({ entry, view }: { entry: FlatEntryModel; view?: number }) {
  const actionLanguage = useActionLanguage()
  const translation = useAuthQuery(
    Queries.ai.translation({
      entry,
      view,
      language: actionLanguage,
    }),
    {
      enabled: !!entry.settings?.translation,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      meta: {
        persist: true,
      },
    },
  )

  const Item: EntryListItemFC = getItemComponentByView(view as FeedViewType)

  return (
    <EntryItemWrapper itemClassName={Item.wrapperClassName} entry={entry} view={view}>
      <Item entryId={entry.entries.id} translation={translation.data} />
    </EntryItemWrapper>
  )
}

export const EntryItem: FC<EntryItemProps> = memo(({ entryId, view }) => {
  const entry = useEntry(entryId)

  if (!entry) return null
  return <EntryItemImpl entry={entry} view={view} />
})

const LoadingCircleFallback = (
  <div className="center mt-2">
    <LoadingCircle size="medium" />
  </div>
)

export const EntryItemSkeleton: FC<{
  view: FeedViewType
  count?: number
}> = memo(({ view, count = 10 }) => {
  const SkeletonItem = getSkeletonItemComponentByView(view)

  if (!SkeletonItem) {
    return LoadingCircleFallback
  }

  if (count === 1) {
    return SkeletonItem
  }

  return (
    <div className={cn(views[view]!.gridMode ? girdClassNames : "flex flex-col")}>
      {Array.from({ length: count }).map((_, index) => (
        // eslint-disable-next-line @eslint-react/no-array-index-key -- index is unique
        <div key={index}>{SkeletonItem}</div>
      ))}
    </div>
  )
})
