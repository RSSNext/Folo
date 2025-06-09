import { Spring } from "@follow/components/constants/spring.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { Checkbox } from "@follow/components/ui/checkbox/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
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
import { views } from "@follow/constants"
import type { ExtractBizResponse } from "@follow/models"
import { jotaiStore } from "@follow/utils/jotai"
import { clsx, formatNumber, sortByAlphabet } from "@follow/utils/utils"
import { useSingleton } from "foxact/use-singleton"
import type { PrimitiveAtom } from "jotai"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { apiClient } from "~/lib/api-fetch"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { useConfirmUnsubscribeSubscriptionModal } from "~/modules/modal/hooks/useConfirmUnsubscribeSubscriptionModal"
import { Balance } from "~/modules/wallet/balance"
import { Queries } from "~/queries"
import { getFeedById, useFeedById } from "~/store/feed"
import { getSubscriptionByFeedId, useAllFeeds, useSubscriptionByFeedId } from "~/store/subscription"

type Analytics = ExtractBizResponse<typeof apiClient.feeds.analytics.$post>["data"]["analytics"]
type SortField = "name" | "view" | "date"
type SortDirection = "asc" | "desc"

export const SettingFeeds = () => {
  const inMas = useIsInMASReview()
  return (
    <div className="space-y-4 pb-8">
      <SubscriptionFeedsSection />
      {!inMas && <FeedClaimedSection />}
    </div>
  )
}

const GRID_COLS_CLASSNAME = tw`grid-cols-[30px_auto_150px_120px_100px]`

const SubscriptionFeedsSection = () => {
  const { t } = useTranslation("settings")
  const allFeeds = useAllFeeds()
  const [selectedFeeds, setSelectedFeeds] = useState<Set<string>>(() => new Set())
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

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
        setSelectedFeeds(new Set(allFeeds.map((feed) => feed.id)))
      } else {
        setSelectedFeeds(new Set())
      }
    },
    [allFeeds],
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

  const isAllSelected = allFeeds.length > 0 && selectedFeeds.size === allFeeds.length

  const presentDeleteSubscription = useConfirmUnsubscribeSubscriptionModal()
  const handleBatchUnsubscribe = useCallback(() => {
    const feedIds = Array.from(selectedFeeds)
    presentDeleteSubscription(feedIds)
  }, [presentDeleteSubscription, selectedFeeds])

  const [visibleableFeedIds, setVisibleableFeedIds] = useState<Set<string>>(() => new Set())
  const scrollContainerElement = useScrollViewElement()
  useEffect(() => {
    if (!scrollContainerElement) return
    const observer = new IntersectionObserver((entries) => {
      setVisibleableFeedIds((prevSet) => {
        const nextSet = new Set(prevSet)
        entries.forEach((entry) => {
          const targetId = (entry.target as HTMLButtonElement).dataset.id
          if (targetId) {
            if (entry.isIntersecting) {
              nextSet.add(targetId)
            } else {
              nextSet.delete(targetId)
            }
          }
        })
        return nextSet
      })
    })
    scrollContainerElement.querySelectorAll("[data-id]").forEach((el) => {
      observer.observe(el)
    })
    return () => {
      observer.disconnect()
    }
  }, [scrollContainerElement])

  const isFetchedSetRef = useSingleton(() => new Set())
  const [analytics] = useState(() => atom<Analytics>({}))

  const pendingFetchIdsRef = useRef<Set<string>>(new Set())
  const timeoutRef = useRef<NodeJS.Timeout>(void 0)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    visibleableFeedIds.forEach((id) => {
      if (!isFetchedSetRef.current.has(id)) {
        pendingFetchIdsRef.current.add(id)
      }
    })

    timeoutRef.current = setTimeout(() => {
      const fetchedIds = Array.from(pendingFetchIdsRef.current)
      if (fetchedIds.length > 0) {
        fetchedIds.forEach((id) => {
          isFetchedSetRef.current.add(id)
        })

        // Clear pending batch
        pendingFetchIdsRef.current.clear()

        apiClient.feeds.analytics
          .$post({
            json: {
              id: fetchedIds,
            },
          })
          .then((res) => {
            jotaiStore.set(analytics, {
              ...jotaiStore.get(analytics),
              ...res.data.analytics,
            })
          })
          .catch((_error) => {
            fetchedIds.forEach((id) => {
              isFetchedSetRef.current.delete(id)
            })
          })
      }
    }, 200)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [analytics, isFetchedSetRef, visibleableFeedIds])

  return (
    <section className="relative mt-4">
      <h2 className="mb-2 text-lg font-semibold">{t("feeds.subscription")}</h2>

      {allFeeds.length > 0 && (
        <div className="mt-8 space-y-1">
          {/* Header - Sticky */}
          <div
            className={clsx(
              "bg-background text-text-secondary sticky top-0 z-20 grid h-8 gap-4 border-b px-1 pb-2 text-sm font-medium",
              GRID_COLS_CLASSNAME,
            )}
          >
            <div className="flex items-center justify-center">
              <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
            </div>
            <button
              type="button"
              className="hover:text-text text-left transition-colors"
              onClick={() => handleSort("name")}
            >
              {t("feeds.tableHeaders.name")}
              {sortField === "name" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              type="button"
              className="hover:text-text ml-4 text-left transition-colors"
              onClick={() => handleSort("view")}
            >
              View
              {sortField === "view" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <button
              className="hover:text-text text-center transition-colors"
              onClick={() => handleSort("date")}
              type="button"
            >
              Date
              {sortField === "date" && (
                <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>
              )}
            </button>
            <div className="text-center">Analytics</div>
          </div>

          {/* Feed List */}
          <SortedFeedsList
            feeds={allFeeds}
            sortField={sortField}
            sortDirection={sortDirection}
            selectedFeeds={selectedFeeds}
            analyticsAtom={analytics}
            onSelect={handleSelectFeed}
          />

          {/* Sticky Action Bar at bottom when scrolled */}
          <AnimatePresence>
            {selectedFeeds.size > 0 && (
              <>
                <m.div
                  initial={{ opacity: 0, transform: "translateY(10px)" }}
                  animate={{ opacity: 1, transform: "translateY(0)" }}
                  exit={{ opacity: 0, transform: "translateY(10px)" }}
                  transition={Spring.presets.smooth}
                  className="sticky bottom-16 mt-4 flex justify-center"
                >
                  <div className="text-text-secondary bg-material-opaque rounded-md px-4 py-2 text-sm">
                    {selectedFeeds.size} item(s) selected
                    <button
                      className="text-accent cursor-button ml-3 text-xs"
                      type="button"
                      onClick={() => setSelectedFeeds(new Set())}
                    >
                      Clear
                    </button>
                  </div>
                </m.div>
                <m.div
                  initial={{ opacity: 0, transform: "translateY(10px)" }}
                  animate={{ opacity: 1, transform: "translateY(0)" }}
                  exit={{ opacity: 0, transform: "translateY(10px)" }}
                  transition={Spring.presets.smooth}
                  className="sticky bottom-4 flex justify-center"
                >
                  <div className="bg-material-opaque flex items-center gap-2 rounded px-4 py-2">
                    {/* <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="text-accent text-xs"
                          type="button"
                          onClick={handleBatchMoveToView}
                        >
                          Add to Category
                        </button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent side="top">
                        <CategorySelector />
                      </DropdownMenuContent>
                    </DropdownMenu> */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MotionButtonBase className="text-accent text-xs" type="button">
                          Move to View
                        </MotionButtonBase>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top">
                        <ViewSelector selectedFeeds={selectedFeeds} />
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <MotionButtonBase
                      className="text-red text-xs"
                      type="button"
                      onClick={handleBatchUnsubscribe}
                    >
                      Unsubscribe
                    </MotionButtonBase>
                  </div>
                </m.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  )
}

const SortedFeedsList: FC<{
  feeds: Array<{ id: string }>
  analyticsAtom: PrimitiveAtom<Analytics>
  sortField: SortField
  sortDirection: SortDirection
  selectedFeeds: Set<string>
  onSelect: (feedId: string, checked: boolean) => void
}> = ({ feeds, sortField, sortDirection, selectedFeeds, onSelect, analyticsAtom }) => {
  const sortedFeedIds = useMemo(() => {
    switch (sortField) {
      case "date": {
        return feeds
          .sort((a, b) => {
            const aSubscription = getSubscriptionByFeedId(a.id)
            const bSubscription = getSubscriptionByFeedId(b.id)
            if (!aSubscription || !bSubscription) return 0
            const aDate = new Date(aSubscription.createdAt)
            const bDate = new Date(bSubscription.createdAt)
            return sortDirection === "asc"
              ? aDate.getTime() - bDate.getTime()
              : bDate.getTime() - aDate.getTime()
          })
          .map((f) => f.id)
      }
      case "view": {
        return feeds
          .sort((a, b) => {
            const aSubscription = getSubscriptionByFeedId(a.id)
            const bSubscription = getSubscriptionByFeedId(b.id)
            if (!aSubscription || !bSubscription) return 0
            return sortDirection === "asc"
              ? aSubscription.view - bSubscription.view
              : bSubscription.view - aSubscription.view
          })
          .map((f) => f.id)
      }
      case "name": {
        return feeds
          .sort((a, b) => {
            const aSubscription = getSubscriptionByFeedId(a.id)
            const bSubscription = getSubscriptionByFeedId(b.id)
            if (!aSubscription || !bSubscription) return 0
            const aFeed = getFeedById(a.id)
            const bFeed = getFeedById(b.id)
            if (!aFeed || !bFeed) return 0
            const aCompareTitle = aSubscription.title || aFeed.title || ""
            const bCompareTitle = bSubscription.title || bFeed.title || ""
            return sortDirection === "asc"
              ? sortByAlphabet(aCompareTitle, bCompareTitle)
              : sortByAlphabet(bCompareTitle, aCompareTitle)
          })
          .map((f) => f.id)
      }
    }
  }, [feeds, sortDirection, sortField])

  return sortedFeedIds.map((feedId) => (
    <FeedListItem
      id={feedId}
      key={feedId}
      selected={selectedFeeds.has(feedId)}
      onSelect={onSelect}
      analyticsAtom={analyticsAtom}
    />
  ))
}

const ViewSelector: FC<{ selectedFeeds: Set<string> }> = ({ selectedFeeds }) => {
  const { t: tCommon } = useTranslation("common")
  const { mutate: batchUpdateSubscription } = useBatchUpdateSubscription()
  const { ask } = useDialog()
  return views.map((view) => {
    return (
      <DropdownMenuItem
        key={view.view}
        icon={view.icon}
        onClick={() => {
          ask({
            title: "Confirm",
            message: `Are you sure you want to move these feeds to ${tCommon(view.name)}?`,
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
    analyticsAtom,
  }: {
    id: string
    selected: boolean
    onSelect: (feedId: string, checked: boolean) => void
    analyticsAtom: PrimitiveAtom<Analytics>
  }) => {
    const analytics = useAtomValue(
      useMemo(() => selectAtom(analyticsAtom, (a) => a[id]), [analyticsAtom, id]),
    )
    const subscription = useSubscriptionByFeedId(id)
    const feed = useFeedById(id)
    const isCustomizeName = subscription?.title && feed?.title !== subscription?.title
    const { t: tCommon } = useTranslation("common")

    if (!subscription) return null

    return (
      <div
        data-id={id}
        role="button"
        tabIndex={-1}
        className={clsx(
          "hover:bg-material-medium grid h-10 w-full items-center gap-4 rounded px-1",
          "content-visibility-auto contain-intrinsic-size-[auto_2.5rem]",
          GRID_COLS_CLASSNAME,
        )}
        onClick={() => onSelect(id, !selected)}
      >
        <div className="flex items-center justify-center">
          <Checkbox checked={selected} onCheckedChange={(checked) => onSelect(id, !!checked)} />
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <FeedIcon feed={feed} size={16} />
          <div className="flex min-w-0 flex-col">
            {feed?.errorAt ? (
              <Tooltip>
                <TooltipTrigger>
                  <EllipsisHorizontalTextWithTooltip className="text-red font-medium leading-4">
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
              <EllipsisHorizontalTextWithTooltip className="text-text font-medium leading-4">
                {subscription.title || feed?.title}
              </EllipsisHorizontalTextWithTooltip>
            )}
            {isCustomizeName && (
              <EllipsisHorizontalTextWithTooltip className="text-text-secondary text-left text-sm">
                {feed?.title}
              </EllipsisHorizontalTextWithTooltip>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {views[subscription.view]!.icon}
          <span>{tCommon(views[subscription.view]!.name)}</span>
        </div>
        <div className="pr-1 text-center">
          <RelativeDay date={new Date(subscription.createdAt)} />
        </div>
        <div className="text-center text-xs">
          {analytics ? (
            <div className="flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-text-secondary flex items-center gap-1">
                      <i className="i-mgc-user-3-cute-re" />
                      <span className="tabular-nums">
                        {formatNumber(analytics.subscriptionCount || 0)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent>Subscription Count</TooltipContent>
                  </TooltipPortal>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-text-secondary flex items-center gap-1">
                      <i className="i-mgc-safety-certificate-cute-re" />
                      <span className="tabular-nums">
                        {Math.round(analytics.updatesPerWeek || 0) || "0"}
                        {"/w"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipPortal>
                    <TooltipContent>Updates Per Week</TooltipContent>
                  </TooltipPortal>
                </Tooltip>
              </div>
              {analytics.latestEntryPublishedAt && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-text-secondary">
                      <i className="i-mgc-calendar-time-add-cute-re" />
                      <RelativeDay date={new Date(analytics.latestEntryPublishedAt)} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Latest Entry Published</TooltipContent>
                </Tooltip>
              )}
            </div>
          ) : (
            <div className="text-text-secondary">--</div>
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
          <div className="text-text-secondary mt-36 w-full text-center text-sm">
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
                        <FeedIcon fallback feed={row.feed} size={16} />
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
