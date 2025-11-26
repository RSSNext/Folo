import { Spring } from "@follow/components/constants/spring.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { RSSHubLogo } from "@follow/components/ui/platform-icon/icons.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { getView, getViewList } from "@follow/constants"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById, usePrefetchFeedAnalytics } from "@follow/store/feed/hooks"
import { getSubscriptionByFeedId } from "@follow/store/subscription/getter"
import {
  useAllFeedSubscriptionIds,
  useSubscriptionByFeedId,
} from "@follow/store/subscription/hooks"
import { clsx, formatNumber, sortByAlphabet } from "@follow/utils/utils"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useIsInMASReview } from "~/atoms/server-configs"
import { RelativeDay } from "~/components/ui/datetime"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useDialog } from "~/components/ui/modal/stacked/hooks"
import { useBatchUpdateSubscription } from "~/hooks/biz/useSubscriptionActions"
import { useAuthQuery } from "~/hooks/common"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { useConfirmUnsubscribeSubscriptionModal } from "~/modules/modal/hooks/useConfirmUnsubscribeSubscriptionModal"
import { SettingModalContentPortal } from "~/modules/settings/modal/layout"
import { Balance } from "~/modules/wallet/balance"
import { Queries } from "~/queries"

type SortField = "name" | "view" | "date" | "subscriptionCount" | "updatesPerWeek"
type SortDirection = "asc" | "desc"
type FeedFilter = "all" | "rsshub"

export const SettingFeeds = () => {
  const inMas = useIsInMASReview()
  return (
    <div className="space-y-4 pb-8">
      <SubscriptionFeedsSection />
      {!inMas && <FeedClaimedSection />}
    </div>
  )
}

const GRID_COLS_CLASSNAME = "grid-cols-[30px_auto_100px_150px_60px_60px]"

const SubscriptionFeedsSection = () => {
  const { t } = useTranslation("settings")
  const allFeeds = useAllFeedSubscriptionIds()
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(() => new Set())
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [filter, setFilter] = useState<FeedFilter>("all")

  // Calculate RSSHub feeds count
  const rsshubFeedsCount = useMemo(() => {
    return allFeeds.filter((feedId) => {
      const feed = getFeedById(feedId)
      return Boolean(feed?.url?.startsWith("rsshub://"))
    }).length
  }, [allFeeds])

  // Filter feeds based on selected filter
  const filteredFeeds = useMemo(() => {
    if (filter === "all") {
      return allFeeds
    }
    return allFeeds.filter((feedId) => {
      const feed = getFeedById(feedId)
      return Boolean(feed?.url?.startsWith("rsshub://"))
    })
  }, [allFeeds, filter])

  // Clean up selectedFeeds when filter changes
  const filteredFeedsSet = useMemo(() => new Set(filteredFeeds), [filteredFeeds])

  // Clean selected feeds that are not in current filter
  useEffect(() => {
    setSelectedFeeds((prev) => {
      const cleaned = new Set<string>()
      prev.forEach((feedId) => {
        if (filteredFeedsSet.has(feedId)) {
          cleaned.add(feedId)
        }
      })
      return cleaned
    })
  }, [filteredFeedsSet])

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc")
      } else {
        setSortField(field)
        setSortDirection("asc")
      }
    },
    [sortField, sortDirection],
  )

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedFeeds(new Set(filteredFeeds))
      } else {
        setSelectedFeeds(new Set())
      }
    },
    [filteredFeeds],
  )

  const handleSelectFeed = useCallback((feedId: string, checked: boolean) => {
    setSelectedFeeds((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(feedId)
      } else {
        newSet.delete(feedId)
      }
      return newSet
    })
  }, [])

  const isAllSelected = filteredFeeds.length > 0 && selectedFeeds.size === filteredFeeds.length

  const presentDeleteSubscription = useConfirmUnsubscribeSubscriptionModal()
  const handleBatchUnsubscribe = useCallback(() => {
    const feedIds = Array.from(selectedFeeds)
    presentDeleteSubscription(feedIds, () => setSelectedFeeds(new Set()))
  }, [presentDeleteSubscription, selectedFeeds, setSelectedFeeds])

  return (
    <section className="relative mt-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("feeds.subscription")}</h2>
        {allFeeds.length > 0 && (
          <ResponsiveSelect
            size="sm"
            triggerClassName="w-36"
            value={filter}
            onValueChange={(value) => setFilter(value as FeedFilter)}
            items={[
              {
                label: t("feeds.filter.all", { count: allFeeds.length }),
                value: "all",
              },
              {
                label: t("feeds.filter.rsshub", { count: rsshubFeedsCount }),
                value: "rsshub",
              },
            ]}
          />
        )}
      </div>

      {filteredFeeds.length > 0 && (
        <div className="mt-6 space-y-0.5">
          {/* Header - Sticky */}
          <div
            className={clsx(
              "sticky top-0 z-20 grid h-7 gap-3 border-b border-border bg-background/80 px-1 pb-1.5 text-xs font-medium text-text-secondary backdrop-blur-sm",
              GRID_COLS_CLASSNAME,
            )}
          >
            <div className="flex items-center justify-center">
              <Checkbox size="sm" checked={isAllSelected} onCheckedChange={handleSelectAll} />
            </div>
            <button
              type="button"
              className="text-left transition-colors hover:text-text"
              onClick={() => handleSort("name")}
            >
              {t("feeds.tableHeaders.name")}
              {sortField === "name" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              type="button"
              className="ml-4 text-left transition-colors hover:text-text"
              onClick={() => handleSort("view")}
            >
              {t("feeds.tableHeaders.view")}
              {sortField === "view" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              className="text-center transition-colors hover:text-text"
              onClick={() => handleSort("date")}
              type="button"
            >
              {t("feeds.tableHeaders.date")}
              {sortField === "date" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              className="text-nowrap text-center transition-colors hover:text-text"
              onClick={() => handleSort("subscriptionCount")}
              type="button"
            >
              {t("feeds.tableHeaders.followers")}
              {sortField === "subscriptionCount" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              className="text-nowrap text-center transition-colors hover:text-text"
              onClick={() => handleSort("updatesPerWeek")}
              type="button"
            >
              {t("feeds.tableHeaders.updatesPerWeek")}
              {sortField === "updatesPerWeek" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
          </div>

          {/* Feed List */}
          <div className="relative">
            <SortedFeedsList
              feeds={filteredFeeds}
              sortField={sortField}
              sortDirection={sortDirection}
              selectedFeeds={selectedFeeds}
              onSelect={handleSelectFeed}
            />
          </div>
        </div>
      )}

      {/* Sticky Action Bar at bottom when scrolled */}
      <AnimatePresence>
        {selectedFeeds.size > 0 && (
          <SettingModalContentPortal>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={Spring.presets.smooth}
              className="absolute inset-x-0 bottom-3 z-10 flex justify-center px-3"
            >
              <div
                className="relative overflow-hidden rounded-2xl backdrop-blur-2xl"
                style={{
                  backgroundImage:
                    "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "hsl(var(--fo-a) / 0.2)",
                  boxShadow:
                    "0 8px 32px hsl(var(--fo-a) / 0.08), 0 4px 16px hsl(var(--fo-a) / 0.06), 0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* Inner glow layer */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.05), transparent, hsl(var(--fo-a) / 0.05))",
                  }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between gap-4 px-5 py-3">
                  <span className="text-sm text-text-secondary">
                    {t("feeds.tableSelected.item", { count: selectedFeeds.size })}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      className="cursor-button text-xs text-accent transition-colors hover:text-accent/80"
                      type="button"
                      onClick={() => setSelectedFeeds(new Set())}
                    >
                      {t("feeds.tableSelected.clear")}
                    </button>

                    <div
                      className="h-4 w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent, hsl(var(--fo-a) / 0.2), transparent)",
                      }}
                    />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MotionButtonBase
                          className="text-xs text-accent transition-colors hover:text-accent/80"
                          type="button"
                        >
                          {t("feeds.tableSelected.moveToView.action")}
                        </MotionButtonBase>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top">
                        <ViewSelector selectedFeeds={selectedFeeds} />
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <MotionButtonBase
                      className="text-xs text-red transition-colors hover:text-red/80"
                      type="button"
                      onClick={handleBatchUnsubscribe}
                    >
                      {t("feeds.tableSelected.unsubscribe")}
                    </MotionButtonBase>
                  </div>
                </div>
              </div>
            </m.div>
          </SettingModalContentPortal>
        )}
      </AnimatePresence>
    </section>
  )
}

const SortedFeedsList: FC<{
  feeds: string[]
  sortField: SortField
  sortDirection: SortDirection
  selectedFeeds: Set<string>
  onSelect: (feedId: string, checked: boolean) => void
}> = ({ feeds, sortField, sortDirection, selectedFeeds, onSelect }) => {
  const scrollContainerElement = useScrollViewElement()

  const sortedFeedIds = useMemo(() => {
    switch (sortField) {
      case "date": {
        return feeds.sort((a, b) => {
          const aSubscription = getSubscriptionByFeedId(a)
          const bSubscription = getSubscriptionByFeedId(b)
          if (!aSubscription || !bSubscription) return 0
          if (!aSubscription.createdAt || !bSubscription.createdAt) return 0
          const aDate = new Date(aSubscription.createdAt)
          const bDate = new Date(bSubscription.createdAt)
          return sortDirection === "asc"
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime()
        })
      }
      case "view": {
        return feeds.sort((a, b) => {
          const aSubscription = getSubscriptionByFeedId(a)
          const bSubscription = getSubscriptionByFeedId(b)
          if (!aSubscription || !bSubscription) return 0
          return sortDirection === "asc"
            ? aSubscription.view - bSubscription.view
            : bSubscription.view - aSubscription.view
        })
      }
      case "name": {
        return feeds.sort((a, b) => {
          const aSubscription = getSubscriptionByFeedId(a)
          const bSubscription = getSubscriptionByFeedId(b)
          if (!aSubscription || !bSubscription) return 0
          const aFeed = getFeedById(a)
          const bFeed = getFeedById(b)
          if (!aFeed || !bFeed) return 0
          const aCompareTitle = aSubscription.title || aFeed.title || ""
          const bCompareTitle = bSubscription.title || bFeed.title || ""
          return sortDirection === "asc"
            ? sortByAlphabet(aCompareTitle, bCompareTitle)
            : sortByAlphabet(bCompareTitle, aCompareTitle)
        })
      }
      case "updatesPerWeek": {
        return feeds.sort((a, b) => {
          const aSubscription = getSubscriptionByFeedId(a)
          const bSubscription = getSubscriptionByFeedId(b)
          if (!aSubscription || !bSubscription) return 0
          const aFeed = getFeedById(a)
          const bFeed = getFeedById(b)
          if (!aFeed || !bFeed) return 0
          return sortDirection === "asc"
            ? (aFeed.updatesPerWeek || 0) - (bFeed.updatesPerWeek || 0)
            : (bFeed.updatesPerWeek || 0) - (aFeed.updatesPerWeek || 0)
        })
      }
      case "subscriptionCount": {
        return feeds.sort((a, b) => {
          const aSubscription = getSubscriptionByFeedId(a)
          const bSubscription = getSubscriptionByFeedId(b)
          if (!aSubscription || !bSubscription) return 0
          const aFeed = getFeedById(a)
          const bFeed = getFeedById(b)
          if (!aFeed || !bFeed) return 0
          return sortDirection === "asc"
            ? (aFeed.subscriptionCount || 0) - (bFeed.subscriptionCount || 0)
            : (bFeed.subscriptionCount || 0) - (aFeed.subscriptionCount || 0)
        })
      }
    }
  }, [feeds, sortDirection, sortField])

  const rowVirtualizer = useVirtualizer({
    count: sortedFeedIds.length,
    getScrollElement: () => scrollContainerElement,
    estimateSize: () => 38, // Estimated height of each feed item (h-9 = 36px + 2px gap)
    overscan: 5,
  })

  // Track visible feeds for analytics prefetching
  const virtualItems = rowVirtualizer.getVirtualItems()
  const visibleFeedIds = useMemo(() => {
    const feedIds: string[] = []
    virtualItems.forEach((item) => {
      const feedId = sortedFeedIds[item.index]
      if (feedId) {
        feedIds.push(feedId)
      }
    })
    return feedIds
  }, [virtualItems, sortedFeedIds])

  usePrefetchFeedAnalytics(visibleFeedIds)

  return (
    <div
      className="space-y-0.5"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`,
        width: "100%",
        position: "relative",
      }}
    >
      {virtualItems.map((virtualRow) => {
        const feedId = sortedFeedIds[virtualRow.index]
        if (!feedId) return null

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <FeedListItem id={feedId} selected={selectedFeeds.has(feedId)} onSelect={onSelect} />
          </div>
        )
      })}
    </div>
  )
}

const ViewSelector: FC<{ selectedFeeds: Set<string> }> = ({ selectedFeeds }) => {
  const { t } = useTranslation("settings")
  const { t: tCommon } = useTranslation("common")
  const { mutate: batchUpdateSubscription } = useBatchUpdateSubscription()
  const { ask } = useDialog()
  return getViewList().map((view) => {
    return (
      <DropdownMenuItem
        key={view.view}
        icon={view.icon}
        onClick={() => {
          ask({
            title: t("feeds.tableSelected.moveToView.confirmTitle"),
            message: t("feeds.tableSelected.moveToView.confirm", { view: tCommon(view.name) }),
            onConfirm: () => {
              batchUpdateSubscription({
                feedIdList: Array.from(selectedFeeds),
                view: view.view,
              })
            },
          })
        }}
      >
        {tCommon(view.name)}
      </DropdownMenuItem>
    )
  })
}

const FeedListItem = memo(
  ({
    id,
    selected,
    onSelect,
  }: {
    id: string
    selected: boolean
    onSelect: (feedId: string, checked: boolean) => void
  }) => {
    const subscription = useSubscriptionByFeedId(id)
    const feed = useFeedById(id)
    const isCustomizeName = subscription?.title && feed?.title !== subscription?.title
    const { t: tCommon } = useTranslation("common")
    const isRSSHub = Boolean(feed?.url?.startsWith("rsshub://"))

    if (!subscription) return null

    return (
      <div
        data-id={id}
        role="button"
        tabIndex={-1}
        className={clsx(
          "group relative grid h-9 w-full items-center gap-3 rounded-md px-1.5 transition-all",
          "content-visibility-auto contain-intrinsic-size-[auto_2.25rem]",
          GRID_COLS_CLASSNAME,
          "hover:bg-material-medium",

          selected && "bg-material-thick",
        )}
        onClick={() => onSelect(id, !selected)}
      >
        <div className="flex items-center justify-center">
          <Checkbox
            size="sm"
            checked={selected}
            onCheckedChange={(checked) => onSelect(id, !!checked)}
          />
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          <FeedIcon target={feed} size={14} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1">
              {feed?.errorAt ? (
                <Tooltip>
                  <TooltipTrigger>
                    <EllipsisHorizontalTextWithTooltip className="text-sm font-medium leading-tight text-red">
                      {subscription.title || feed?.title}
                    </EllipsisHorizontalTextWithTooltip>
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent>
                      {feed?.errorMessage || "Feed has encountered an error"}
                    </TooltipContent>
                  </TooltipPortal>
                </Tooltip>
              ) : (
                <EllipsisHorizontalTextWithTooltip className="text-sm font-medium leading-tight text-text">
                  {subscription.title || feed?.title}
                </EllipsisHorizontalTextWithTooltip>
              )}
              {isRSSHub && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex shrink-0 items-center gap-0.5 rounded bg-orange/20 px-1 py-0.5 text-[9px] font-semibold text-orange shadow-sm ring-1 ring-orange/30">
                      <RSSHubLogo className="size-2.5" />
                      <span>RSSHub</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent>This feed is powered by RSSHub</TooltipContent>
                  </TooltipPortal>
                </Tooltip>
              )}
            </div>
            {isCustomizeName && (
              <EllipsisHorizontalTextWithTooltip className="text-left text-xs leading-tight text-text-secondary">
                {feed?.title}
              </EllipsisHorizontalTextWithTooltip>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-xs text-text opacity-80">
          {getView(subscription.view)!.icon}
          <span className="leading-tight">{tCommon(getView(subscription.view)!.name)}</span>
        </div>
        {!!subscription.createdAt && (
          <div className="whitespace-nowrap pr-1 text-center text-xs">
            <RelativeDay date={new Date(subscription.createdAt)} />
          </div>
        )}
        <div className="text-center text-xs">
          {feed?.subscriptionCount ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center gap-0.5 text-text-secondary">
                  <i className="i-mgc-user-3-cute-re text-[10px]" />
                  <span className="text-[11px] tabular-nums">
                    {formatNumber(feed.subscriptionCount)}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>Subscription Count</TooltipContent>
              </TooltipPortal>
            </Tooltip>
          ) : (
            <div className="text-[11px] text-text-secondary">--</div>
          )}
        </div>
        <div className="text-center text-xs">
          {feed?.updatesPerWeek ? (
            <div className="flex justify-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center gap-0.5 text-text-secondary">
                    <i className="i-mgc-safety-certificate-cute-re text-[10px]" />
                    <span className="text-[11px] tabular-nums">
                      {Math.round(feed.updatesPerWeek)}
                      {"/w"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent>Updates Per Week</TooltipContent>
                </TooltipPortal>
              </Tooltip>
              {feed.latestEntryPublishedAt && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-[10px] text-text-secondary">
                      <i className="i-mgc-calendar-time-add-cute-re" />
                      <RelativeDay date={new Date(feed.latestEntryPublishedAt)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Latest Entry Published</TooltipContent>
                </Tooltip>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-text-secondary">--</div>
          )}
        </div>
      </div>
    )
  },
)

const FeedClaimedSection = () => {
  const { t } = useTranslation("settings")
  const claimedList = useAuthQuery(Queries.feed.claimedList())

  const numberFormatter = useMemo(() => new Intl.NumberFormat("en-US", {}), [])

  return (
    <section className="mt-4">
      <div>
        <h2 className="mb-2 text-lg font-semibold">{t("feeds.claim")}</h2>
      </div>
      <div className="mb-4 space-y-2 text-sm">
        <p>{t("feeds.claimTips")}</p>
      </div>
      <Divider className="mb-6 mt-8" />
      <div className="flex flex-1 flex-col">
        {claimedList.isLoading ? (
          <LoadingCircle size="large" className="center h-36" />
        ) : !claimedList.data?.length ? (
          <div className="mt-36 w-full text-center text-sm text-text-secondary">
            <p>{t("feeds.noFeeds")}</p>
          </div>
        ) : null}
        {claimedList.data?.length ? (
          <ScrollArea.ScrollArea viewportClassName="max-h-[380px]">
            <Table className="mt-4">
              <TableHeader className="border-b">
                <TableRow className="[&_*]:!font-semibold">
                  <TableHead className="w-16 text-center" size="sm">
                    {t("feeds.tableHeaders.name")}
                  </TableHead>
                  <TableHead className="text-center" size="sm">
                    {t("feeds.tableHeaders.subscriptionCount")}
                  </TableHead>
                  <TableHead className="text-center" size="sm">
                    {t("feeds.tableHeaders.tipAmount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-t-[12px] border-transparent">
                {claimedList.data?.map((row) => (
                  <TableRow key={row.feed.id} className="h-8">
                    <TableCell size="sm" width={200}>
                      <a
                        target="_blank"
                        href={UrlBuilder.shareFeed(row.feed.id)}
                        className="flex items-center"
                      >
                        <FeedIcon fallback target={row.feed} size={16} />
                        <EllipsisHorizontalTextWithTooltip className="inline-block max-w-[200px] truncate">
                          {row.feed.title}
                        </EllipsisHorizontalTextWithTooltip>
                      </a>
                    </TableCell>
                    <TableCell align="center" className="tabular-nums" size="sm">
                      {numberFormatter.format(row.subscriptionCount)}
                    </TableCell>
                    <TableCell align="center" size="sm">
                      <Balance>{BigInt(row.tipAmount || 0n)}</Balance>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea.ScrollArea>
        ) : null}
      </div>
    </section>
  )
}
