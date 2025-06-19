import { useEntry } from "@follow/store/entry/hooks"
import { useIsListSubscription } from "@follow/store/subscription/hooks"
import { clsx } from "@follow/utils/utils"
import type { FC, Key } from "react"
import { Fragment, memo, useMemo } from "react"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { EntryVirtualListItem } from "../item"
import { DateItem } from "./DateItem"

interface VirtualRowItemProps {
  virtualRowKey: Key
  entriesIds: string[]
  virtualRowIndex: number
  view: any
  transform: string
  isStickyItem: boolean
  isActiveStickyItem: boolean
  measureElement: (element: Element | null) => void
}

const EntryHeadDateItem: FC<{
  entryId: string
  isSticky?: boolean
}> = ({ entryId, isSticky }) => {
  const entry = useEntry(entryId, (state) => {
    const { insertedAt, publishedAt } = state

    return { insertedAt, publishedAt }
  })

  const routeParams = useRouteParams()
  const { feedId, view } = routeParams
  const isList = useIsListSubscription(feedId)

  if (!entry) return null
  const date = new Date(isList ? entry.insertedAt : entry.publishedAt).toDateString()

  return <DateItem isSticky={isSticky} date={date} view={view} />
}

export const VirtualRowItem: FC<VirtualRowItemProps> = memo(
  ({
    virtualRowKey,
    entriesIds,
    virtualRowIndex,
    view,
    transform,
    isStickyItem,
    isActiveStickyItem,
    measureElement,
  }) => {
    return (
      <Fragment key={virtualRowKey}>
        {isStickyItem && (
          <div
            className={clsx(
              "bg-background",
              isActiveStickyItem
                ? "sticky top-0 z-[1]"
                : "absolute left-0 top-0 z-[1] w-full will-change-transform",
            )}
            style={
              !isActiveStickyItem
                ? {
                    transform,
                  }
                : undefined
            }
          >
            <EntryHeadDateItem
              entryId={entriesIds[virtualRowIndex]!}
              isSticky={isActiveStickyItem}
            />
          </div>
        )}

        <EntryVirtualListItem
          entryId={entriesIds[virtualRowIndex]!}
          view={view}
          data-index={virtualRowIndex}
          style={useMemo(
            () => ({
              transform,
              paddingTop: isStickyItem ? "1.75rem" : undefined,
            }),
            [transform, isStickyItem],
          )}
          ref={measureElement}
        />
      </Fragment>
    )
  },
)
