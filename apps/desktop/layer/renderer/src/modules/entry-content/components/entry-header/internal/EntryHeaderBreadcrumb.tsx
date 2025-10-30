import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/EllipsisWithTooltip.js"
import { getView } from "@follow/constants"
import { getEntry, getEntryIdsByFeedId } from "@follow/store/entry/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { useListById } from "@follow/store/list/hooks"
import {
  getFeedSubscriptionByViewSelector,
  getListSubscriptionByViewSelector,
} from "@follow/store/subscription/getter"
import type {
  useFeedSubscriptionByView,
  useListSubscriptionByView,
} from "@follow/store/subscription/hooks"
import { useSubscriptionStore } from "@follow/store/subscription/store"
import { cn } from "@follow/utils/utils"
import { useForceUpdate } from "motion/react"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useShowEntryDetailsColumn } from "~/hooks/biz/useShowEntryDetailsColumn"
import { getPreferredTitle } from "~/store/feed/hooks"

import { useEntryTitleMeta } from "../../../atoms"
import { useEntryHeaderContext } from "./context"

const Slash = (
  <i className="i-mingcute-line-line size-4 shrink-0 rotate-[-25deg] text-text-tertiary" />
)

function ViewSubscriptionsDropdown({
  view,
  onNavigate,
}: {
  view: number
  onNavigate: ReturnType<typeof useNavigateEntry>
}) {
  const feedSubsRef = useRef<ReturnType<typeof useFeedSubscriptionByView>>([])
  const listSubsRef = useRef<ReturnType<typeof useListSubscriptionByView>>([])
  const [forceUpdate] = useForceUpdate()

  const handleRefreshDropDownData = useCallback(
    (open: boolean) => {
      if (!open) return

      // Get fresh data from store
      const state = useSubscriptionStore.getState()
      const feedSubs = getFeedSubscriptionByViewSelector(state)(view)
      const listSubs = getListSubscriptionByViewSelector(state)(view)

      feedSubsRef.current = feedSubs || []
      listSubsRef.current = listSubs || []

      forceUpdate()
    },
    [view, forceUpdate],
  )

  const routeParams = getRouteParams()
  const { isAllFeeds, listId, feedId } = routeParams

  // Check if there's any subscription data for this view (without causing re-render)
  // This allows initial render to show the dropdown if subscriptions exist
  const state = useSubscriptionStore.getState()
  const initialFeedSubs = getFeedSubscriptionByViewSelector(state)(view)
  const initialListSubs = getListSubscriptionByViewSelector(state)(view)
  const hasAnyInitial = (initialFeedSubs?.length ?? 0) + (initialListSubs?.length ?? 0) > 0

  if (!hasAnyInitial) return null

  return (
    <DropdownMenu onOpenChange={handleRefreshDropDownData}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="no-drag-region -ml-1 inline-flex size-6 items-center justify-center rounded text-text-tertiary transition-colors hover:text-text focus-visible:bg-fill/60"
          aria-label="Open subscriptions of this view"
        >
          <i className="i-mingcute-down-line size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-0">
        <ScrollArea.ScrollArea
          flex
          rootClassName="max-h-[60vh] min-h-0 relative min-w-64"
          viewportClassName="max-h-[60vh]"
        >
          <div className="p-1">
            <DropdownMenuItem
              onClick={() => onNavigate({ entryId: null, view })}
              checked={isAllFeeds}
            >
              <span className="truncate">All</span>
            </DropdownMenuItem>
            {listSubsRef.current && listSubsRef.current.length > 0 && (
              <div className="px-2 py-1 text-xs text-text-tertiary">Lists</div>
            )}
            {listSubsRef.current?.map((s) =>
              s.listId ? (
                <DropdownMenuItem
                  checked={s.listId === listId}
                  key={`list-${s.listId}`}
                  onClick={() => s.listId && onNavigate({ entryId: null, listId: s.listId })}
                >
                  <ListNameItem listId={s.listId} />
                </DropdownMenuItem>
              ) : null,
            )}
            {feedSubsRef.current && feedSubsRef.current.length > 0 && (
              <div className="px-2 py-1 text-xs text-text-tertiary">Feeds</div>
            )}
            {feedSubsRef.current?.map((s) =>
              s.feedId ? (
                <DropdownMenuItem
                  checked={s.feedId === feedId}
                  key={`feed-${s.feedId}`}
                  onClick={() => s.feedId && onNavigate({ entryId: null, feedId: s.feedId })}
                >
                  <FeedNameItem feedId={s.feedId} />
                </DropdownMenuItem>
              ) : null,
            )}
          </div>
        </ScrollArea.ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const ListNameItem = ({ listId }: { listId: string }) => {
  const name = useListById(listId, (s) => s?.title)
  if (!name) return null
  return <span className="truncate">{name}</span>
}

const FeedNameItem = ({ feedId }: { feedId: string }) => {
  const feed = useFeedById(feedId)

  if (!feed) return null
  return <span className="truncate">{getPreferredTitle(feed)}</span>
}

function FeedEntriesDropdown({
  feedId,
  currentEntryId,
  onNavigate,
}: {
  feedId: string
  currentEntryId: string
  onNavigate: ReturnType<typeof useNavigateEntry>
}) {
  const siblingEntriesRef = useRef<{ id: string; title: string }[]>([])
  const [forceUpdate] = useForceUpdate()

  const handleRefreshDropDownData = useCallback(
    (open: boolean) => {
      if (!open) return

      const entryIds = getEntryIdsByFeedId(feedId)
      if (!entryIds) return

      siblingEntriesRef.current = []
      for (const entryId of entryIds) {
        const entry = getEntry(entryId)
        if (!entry) continue
        const { title } = entry
        if (!title) continue
        siblingEntriesRef.current.push({ id: entryId, title })
      }

      forceUpdate()
    },
    [feedId, forceUpdate],
  )

  // Check if there are any entries for this feed
  const entryIds = getEntryIdsByFeedId(feedId)
  if (!entryIds || entryIds.length <= 1) return null

  return (
    <DropdownMenu onOpenChange={handleRefreshDropDownData}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="no-drag-region -ml-2 inline-flex size-6 items-center justify-center rounded text-text-tertiary transition-colors hover:text-text focus-visible:bg-fill/60"
          aria-label="Open entries from this feed"
        >
          <i className="i-mingcute-down-line size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="p-0">
        <ScrollArea.ScrollArea
          rootClassName="max-h-[60vh] min-w-64"
          viewportClassName="max-h-[60vh]"
        >
          <div className="p-1">
            {siblingEntriesRef.current.map((e) => (
              <DropdownMenuItem
                key={e.id}
                onClick={() => onNavigate({ entryId: e.id })}
                checked={e.id === currentEntryId}
              >
                <span className="truncate" title={e.title}>
                  {e.title}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea.ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EntryHeaderBreadcrumb() {
  const meta = useEntryTitleMeta()

  const navigate = useNavigateEntry()
  const { entryId } = useEntryHeaderContext()

  const { t } = useTranslation()
  const view = useRouteParamsSelector((s) => s.view)
  const viewName = getView(view)?.name
  const showEntryDetailsColumn = useShowEntryDetailsColumn()
  if (showEntryDetailsColumn && meta?.entryTitle) {
    return (
      <EllipsisHorizontalTextWithTooltip className="min-w-0 truncate px-1.5 py-0.5 text-lg font-bold leading-tight text-text opacity-0 transition-opacity duration-200 group-data-[at-top=false]/header:opacity-100">
        {meta.entryTitle}
      </EllipsisHorizontalTextWithTooltip>
    )
  }
  return (
    <div className="flex min-w-0 flex-1 overflow-hidden">
      <nav
        aria-label="Breadcrumb"
        className={
          "group/breadcrumb flex min-w-0 items-center gap-1 truncate leading-tight text-text-secondary"
        }
      >
        <div className="flex min-w-0 items-center gap-1">
          {/* Return Back Button  */}
          <button
            type="button"
            className="no-drag-region inline-flex shrink-0 items-center rounded-full bg-transparent p-2 text-text-secondary hover:bg-fill/50 hover:text-text focus-visible:bg-fill/60"
            onClick={() => navigate({ entryId: null, view })}
          >
            <i className="i-mingcute-close-line size-5" />
          </button>
          {viewName && (
            <div className="hidden items-center @[700px]:flex">
              <button
                type="button"
                className={cn(
                  "no-drag-region inline-flex max-w-[40vw] items-center truncate rounded bg-transparent px-1.5 py-0.5 text-sm text-text-secondary transition-colors hover:bg-fill/50 hover:text-text focus-visible:bg-fill/60",
                )}
                onClick={() => navigate({ entryId: null, view })}
              >
                <span className="text-sm text-text-secondary">{t(viewName, { ns: "common" })}</span>
              </button>

              <ViewSubscriptionsDropdown view={view} onNavigate={navigate} />
            </div>
          )}
          {meta && (
            <>
              <span className="hidden @[700px]:inline">{Slash}</span>
              <div className="hidden min-w-0 shrink items-center @[700px]:flex">
                <button
                  type="button"
                  className={cn(
                    "no-drag-region inline-flex max-w-[40vw] items-center truncate rounded bg-transparent px-1.5 py-0.5 text-sm text-text-secondary transition-colors hover:bg-fill/50 hover:text-text focus-visible:bg-fill/60",
                  )}
                  onClick={() => navigate({ entryId: null, feedId: meta.feedId })}
                  title={meta.feedTitle}
                >
                  <span className="truncate">{meta.feedTitle}</span>
                </button>

                <FeedEntriesDropdown
                  feedId={meta.feedId}
                  currentEntryId={entryId}
                  onNavigate={navigate}
                />
              </div>

              {!!meta.entryTitle && (
                <>
                  <span className="hidden shrink-0 @[700px]:inline">{Slash}</span>
                  <span
                    className="min-w-0 max-w-[30vw] truncate px-1.5 py-0.5 text-sm text-text"
                    title={meta.entryTitle}
                  >
                    {meta.entryTitle}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </nav>
    </div>
  )
}
