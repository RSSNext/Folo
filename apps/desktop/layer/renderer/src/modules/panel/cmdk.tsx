import { EmptyIcon } from "@follow/components/icons/empty.jsx"
import { Logo } from "@follow/components/icons/logo.jsx"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.jsx"
import type { FeedViewType } from "@follow/constants"
import { useInputComposition } from "@follow/hooks"
import { getFeedById } from "@follow/store/feed/getter"
import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import { getUnreadById } from "@follow/store/unread/getters"
import { tracker } from "@follow/tracker"
import { clsx, cn } from "@follow/utils/utils"
import { Command } from "cmdk"
import type { FC } from "react"
import * as React from "react"
import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { setAppSearchOpen, useAppSearchOpen } from "~/atoms/app"
import { ExPromise } from "~/components/common/ExPromise"
import { LoadMoreIndicator } from "~/components/common/LoadMoreIndicator"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useI18n } from "~/hooks/common"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { searchActions, useSearchStore, useSearchType } from "~/store/search"
import { SearchType } from "~/store/search/constants"
import type { SearchInstance } from "~/store/search/types"

import styles from "./cmdk.module.css"

const SearchCmdKContext = React.createContext<Promise<SearchInstance> | null>(null)
export const SearchCmdK: React.FC = () => {
  const { t } = useTranslation()
  const open = useAppSearchOpen()

  const [searchInstance, setSearchInstance] = React.useState(() =>
    searchActions.createLocalDbSearch(),
  )
  React.useEffect(() => {
    if (!open) return

    tracker.searchOpen()

    // Refresh data
    setPage(0)
    setSearchInstance(() => searchActions.createLocalDbSearch())
  }, [open])

  const entries = useSearchStore((s) => s.entries)
  const feeds = useSearchStore((s) => s.feeds)

  const inputRef = React.useRef<HTMLInputElement>(null)
  const dialogRef = React.useRef<HTMLDivElement>(null)
  const scrollViewRef = React.useRef<HTMLDivElement>(null)

  const { getTopModalStack } = useModalStack()

  React.useEffect(() => {
    const $input = inputRef.current
    if (open && $input) {
      $input.focus()
    }
  }, [open])

  const { onCompositionEnd, onCompositionStart, isCompositionRef } =
    useInputComposition<HTMLInputElement>({})
  const handleKeyDownToFocusInput: React.EventHandler<React.KeyboardEvent> = React.useCallback(
    (e) => {
      const $input = inputRef.current

      if (e.key === "Escape" && !isCompositionRef.current && !getTopModalStack()) {
        setAppSearchOpen(false)
        return
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") return

      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        $input?.focus()
      }
    },
    [getTopModalStack, isCompositionRef],
  )
  const [isPending, startTransition] = React.useTransition()
  const handleSearch = React.useCallback(
    async (value: string) => {
      const { search } = await searchInstance
      setPage(0)
      startTransition(() => {
        search(value)
        const $scrollView = scrollViewRef.current
        if ($scrollView) {
          $scrollView.scrollTop = 0
        }
      })
    },
    [searchInstance],
  )
  // Performance optimization
  const [page, setPage] = React.useState(0)
  const pageSize = 16
  const renderedEntries = useMemo(() => entries.slice(0, (page + 1) * pageSize), [entries, page])

  const renderedFeeds = useMemo(() => {
    const delta = entries.length - renderedEntries.length

    if (delta > pageSize) return []

    const entriesTotalPage = Math.ceil(entries.length / pageSize)
    const right = entriesTotalPage === page + 1 ? delta : pageSize * page + 1 - entries.length

    return feeds.slice(0, right)
  }, [entries.length, feeds, page, renderedEntries.length])
  const totalCount = entries.length + feeds.length
  const renderedTotalCount = renderedEntries.length + renderedFeeds.length
  const loadMore = React.useCallback(() => {
    const totalPage = Math.ceil((entries.length + feeds.length) / pageSize)
    setPage((p) => Math.min(p + 1, totalPage))
  }, [entries.length, feeds.length])

  const canLoadMore = totalCount > renderedTotalCount && renderedTotalCount > 0

  return (
    <SearchCmdKContext value={searchInstance}>
      <Command.Dialog
        ref={dialogRef}
        shouldFilter={false}
        open={open}
        onKeyDown={handleKeyDownToFocusInput}
        onOpenChange={setAppSearchOpen}
        className={cn(
          "h-[600px] max-h-[80vh] w-[800px] max-w-[100vw] rounded-none md:h-screen md:max-h-[60vh] md:max-w-[80vw]",
          "backdrop-blur-background bg-material-ultra-thick flex min-h-[50vh] flex-col shadow-2xl md:rounded-xl",
          "border-border border-0 md:border",
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
      >
        <Command.Input
          className="border-border w-full shrink-0 border-b bg-transparent p-4 px-5 text-lg leading-4"
          ref={inputRef}
          placeholder={searchActions.getCurrentKeyword() || t("search.placeholder")}
          onValueChange={handleSearch}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
        />
        <div className={cn(styles["status-bar"], isPending && styles["loading"])} />

        <div className="flex flex-1 flex-col overflow-y-hidden">
          <ScrollArea.ScrollArea
            ref={scrollViewRef}
            viewportClassName="max-h-[50vh] [&>div]:!flex"
            rootClassName="flex-1 px-5"
            scrollbarClassName="mb-6"
          >
            <Command.List className="flex w-full min-w-0 flex-col">
              <SearchPlaceholder />

              {renderedEntries.length > 0 && (
                <Command.Group
                  heading={
                    <SearchGroupHeading
                      icon="i-mgc-paper-cute-fi size-4"
                      title={t("search.group.entries")}
                    />
                  }
                  className="flex w-full min-w-0 flex-col py-2"
                >
                  {renderedEntries.map((entry) => {
                    const feed = getFeedById(entry.feedId)
                    return (
                      <SearchItem
                        key={`entry-${entry.item.id}-${entry.feedId}`}
                        view={feed?.id ? getSubscriptionByFeedId(feed.id)?.view : undefined}
                        title={entry.item.title!}
                        feedId={entry.feedId}
                        entryId={entry.item.id}
                        id={entry.item.id}
                        icon={feed?.type === "feed" ? feed?.siteUrl : undefined}
                        subtitle={feed?.title}
                      />
                    )
                  })}
                </Command.Group>
              )}
              {renderedFeeds.length > 0 && (
                <Command.Group
                  heading={
                    <SearchGroupHeading
                      icon="i-mgc-rss-cute-fi size-4 text-accent"
                      title={t("search.group.feeds")}
                    />
                  }
                  className="py-2"
                >
                  {renderedFeeds.map((feed) => (
                    <SearchItem
                      key={`feed-${feed.item.id}`}
                      view={getSubscriptionByFeedId(feed.item.id!)?.view}
                      title={feed.item.title!}
                      feedId={feed.item.id!}
                      entryId={ROUTE_ENTRY_PENDING}
                      id={feed.item.id!}
                      icon={feed.item.type === "feed" ? feed.item.siteUrl : undefined}
                      subtitle={getUnreadById(feed.item.id)?.toString()}
                    />
                  ))}
                </Command.Group>
              )}
              {canLoadMore && <LoadMoreIndicator className="center w-full" onLoading={loadMore} />}
            </Command.List>
          </ScrollArea.ScrollArea>

          <div className="relative flex items-center justify-between px-3 py-2">
            <SearchOptions />
            <SearchResultCount count={totalCount} />
          </div>
        </div>
      </Command.Dialog>
    </SearchCmdKContext>
  )
}

type SearchListType = {
  title: string
  subtitle?: Nullable<string>
  feedId?: string
  entryId?: string
  icon?: Nullable<string>
  id: string
  view?: FeedViewType
}

const SearchItem = memo(function Item({
  id,
  title,
  entryId,
  feedId,

  subtitle,
  view,
}: {} & SearchListType) {
  const navigateEntry = useNavigateEntry()

  const feed = getFeedById(feedId!)

  return (
    <Command.Item
      className={clsx(
        "relative flex w-full justify-between px-1 text-[0.9rem]",
        `before:absolute before:inset-0 before:rounded-md before:content-[""]`,
        "hover:before:bg-zinc-200/60 dark:hover:before:bg-zinc-800/80",
        "data-[selected=true]:before:bg-zinc-200/60 data-[selected=true]:dark:before:bg-zinc-800/80",
        "min-w-0 max-w-full",
        styles["content-visually"],
      )}
      key={`${id}-${feedId}-${entryId}`}
      value={`${id}-${feedId}-${entryId}`}
      onSelect={() => {
        navigateEntry({
          feedId: feedId!,
          entryId,
          view,
        })
      }}
    >
      <div className="relative flex w-full items-center justify-between px-1 py-2">
        {feed && <FeedIcon className="mr-2 size-5 shrink-0 rounded" feed={feed} />}
        <span className="block min-w-0 flex-1 shrink-0 truncate">{title}</span>
        <span className="block min-w-0 shrink-0 grow-0 text-xs font-medium text-zinc-800 opacity-60 dark:text-slate-200/80">
          {subtitle}
        </span>
      </div>
    </Command.Item>
  )
})

const SearchGroupHeading: FC<{ icon: string; title: string }> = ({ icon, title }) => (
  <div className="mb-2 flex items-center gap-2">
    <i className={icon} />
    <span className="text-sm font-semibold">{title}</span>
  </div>
)

const SearchResultCount: FC<{
  count?: number
}> = ({ count }) => {
  const t = useI18n()
  const searchInstance = React.use(SearchCmdKContext)
  const hasKeyword = useSearchStore((s) => !!s.keyword)
  const searchType = useSearchType()

  const recordCountPromise = useMemo(async () => {
    let count = 0
    const counts = await searchInstance?.then((s) => s.counts)
    if (!counts) return 0
    if (searchType & SearchType.Entry) {
      count += counts.entries || 0
    }
    if (searchType & SearchType.Feed) {
      count += counts.feeds || 0
    }
    if (searchType & SearchType.Subscription) {
      count += counts.subscriptions || 0
    }
    return count
  }, [searchInstance, searchType])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <small className="center shrink-0 gap-1 opacity-80">
          {hasKeyword ? (
            <span>
              {count} {t.common("words.result", { count })}
            </span>
          ) : (
            <ExPromise promise={recordCountPromise}>
              {(count) => (
                <>
                  {count} {t.common("quantifier.piece")}
                  {t.common("words.local")}
                  {t.common("space")}
                  {t.common("words.record", { count })}
                </>
              )}
            </ExPromise>
          )}{" "}
          {t("search.result_count_local_mode")}
          <i className="i-mingcute-question-line" />
        </small>
      </TooltipTrigger>
      <TooltipContent>{t("search.tooltip.local_search")}</TooltipContent>
    </Tooltip>
  )
}
const SearchOptions: Component = memo(({ children }) => {
  const { t } = useTranslation()
  const searchType = useSearchType()

  const searchInstance = React.use(SearchCmdKContext)

  return (
    <div className="text-text flex items-center gap-2 text-sm">
      <span className="shrink-0">{t("search.options.search_type")}</span>

      <Select
        onValueChange={async (value) => {
          searchActions.setSearchType(+value as SearchType)

          if (searchInstance) {
            const { search } = await searchInstance
            search(searchActions.getCurrentKeyword())
          }
        }}
        value={`${searchType}`}
      >
        <SelectTrigger size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectItem
            className="hover:bg-theme-item-hover"
            value={`${SearchType.All}`}
            disabled={searchType === SearchType.All}
          >
            {t("search.options.all")}
          </SelectItem>
          <SelectItem
            className="hover:bg-theme-item-hover"
            value={`${SearchType.Entry}`}
            disabled={searchType === SearchType.Entry}
          >
            {t("search.options.entry")}
          </SelectItem>
          <SelectItem
            className="hover:bg-theme-item-hover"
            value={`${SearchType.Feed}`}
            disabled={searchType === SearchType.Feed}
          >
            {t("search.options.feed")}
          </SelectItem>
        </SelectContent>
      </Select>

      {children}
    </div>
  )
})

const SearchPlaceholder = () => {
  const { t } = useTranslation()
  const hasKeyword = useSearchStore((s) => !!s.keyword)
  return (
    <Command.Empty className="center absolute inset-0">
      {hasKeyword ? (
        <div className="flex flex-col items-center justify-center gap-2 opacity-80">
          <EmptyIcon />
          {t("search.empty.no_results")}
        </div>
      ) : (
        <Logo className="size-12 opacity-80 grayscale" />
      )}
    </Command.Empty>
  )
}
