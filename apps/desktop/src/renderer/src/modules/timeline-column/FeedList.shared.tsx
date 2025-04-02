import { isMobile } from "@follow/components/hooks/useMobile.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { views } from "@follow/constants"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import * as HoverCard from "@radix-ui/react-hover-card"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, m } from "framer-motion"
import { memo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { useOnClickOutside } from "usehooks-ts"

import { IconOpacityTransition } from "~/components/ux/transition/icon"
import { FEED_COLLECTION_LIST } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteFeedId } from "~/hooks/biz/useRouteParams"
import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"
import { subscriptionActions, useCategoryOpenStateByView } from "~/store/subscription"
import { feedUnreadActions } from "~/store/unread"
import { useUnreadByView } from "~/store/unread/hooks"

import { getFeedListSort, setFeedListSortBy, setFeedListSortOrder, useFeedListSort } from "./atom"
import { feedColumnStyles } from "./styles"
import { UnreadNumber } from "./UnreadNumber"

export const ListHeader = ({ view }: { view: number }) => {
  useAuthQuery(Queries.subscription.all())
  useAuthQuery(Queries.subscription.unreadAll(), {
    refetchInterval: false,
  })

  const { t } = useTranslation()
  const categoryOpenStateData = useCategoryOpenStateByView(view)
  const expansion = Object.values(categoryOpenStateData).every((value) => value === true)

  useQuery({
    queryKey: ["fetchUnreadByView", view],
    queryFn: () => feedUnreadActions.fetchUnreadByView(view),
    // 10 minute
    refetchInterval: 1000 * 60 * 10,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  })

  const totalUnread = useUnreadByView(view)

  const navigateEntry = useNavigateEntry()

  return (
    <div onClick={stopPropagation} className="mx-3 flex items-center justify-between px-2.5 py-1">
      <div
        className="text-base font-bold"
        onClick={(e) => {
          e.stopPropagation()
          if (!document.hasFocus()) return
          if (view !== undefined) {
            navigateEntry({
              entryId: null,
              feedId: null,
              view,
            })
          }
        }}
      >
        {view !== undefined && t(views[view]!.name, { ns: "common" })}
      </div>
      <div className="lg:!text-theme-vibrancyFg ml-2 flex items-center gap-3 text-base text-zinc-400 lg:text-sm dark:text-zinc-600">
        <SortButton />
        {expansion ? (
          <i
            className="i-mgc-list-collapse-cute-re"
            onClick={() => subscriptionActions.expandCategoryOpenStateByView(view, false)}
          />
        ) : (
          <i
            className="i-mgc-list-expansion-cute-re"
            onClick={() => subscriptionActions.expandCategoryOpenStateByView(view, true)}
          />
        )}
        <UnreadNumber unread={totalUnread} className="text-xs !text-inherit" />
      </div>
    </div>
  )
}

const SORT_LIST = [
  { icon: tw`i-mgc-numbers-90-sort-ascending-cute-re`, by: "count", order: "asc" },
  { icon: tw`i-mgc-numbers-90-sort-descending-cute-re`, by: "count", order: "desc" },

  {
    icon: tw`i-mgc-az-sort-descending-letters-cute-re`,
    by: "alphabetical",
    order: "asc",
  },
  {
    icon: tw`i-mgc-az-sort-ascending-letters-cute-re`,
    by: "alphabetical",
    order: "desc",
  },
] as const

const SortButton = () => {
  const { by, order } = useFeedListSort()
  const { t } = useTranslation()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => {
    setOpen(false)
  })

  return (
    <HoverCard.Root open={open} onOpenChange={setOpen}>
      <HoverCard.Trigger
        onClick={() => {
          if (isMobile()) {
            setOpen(true)
            return
          }
          setFeedListSortBy(by === "count" ? "alphabetical" : "count")
        }}
        className="center"
      >
        <IconOpacityTransition
          icon2={
            order === "asc"
              ? tw`i-mgc-numbers-90-sort-ascending-cute-re`
              : tw`i-mgc-numbers-90-sort-descending-cute-re`
          }
          icon1={
            order === "asc" ? tw`i-mgc-sort-ascending-cute-re` : tw`i-mgc-sort-descending-cute-re`
          }
          status={by === "count" ? "done" : "init"}
        />
      </HoverCard.Trigger>

      <RootPortal>
        <HoverCard.Content ref={ref} className="z-10 -translate-x-4" sideOffset={5} forceMount>
          <AnimatePresence>
            {open && (
              <m.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="border-border bg-theme-modal-background-opaque relative z-10 rounded-md border p-3 shadow-md dark:shadow-zinc-500/20"
              >
                <HoverCard.Arrow className="fill-border -translate-x-4" />
                <section className="w-[170px] text-center">
                  <span className="text-[13px]">{t("sidebar.select_sort_method")}</span>
                  <div className="mt-4 grid grid-cols-2 grid-rows-2 gap-2">
                    {SORT_LIST.map(({ icon, by, order }) => {
                      const current = getFeedListSort()
                      const active = by === current.by && order === current.order
                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setFeedListSortBy(by)
                            setFeedListSortOrder(order)
                          }}
                          key={`${by}-${order}`}
                          className={cn(
                            "center border-border flex aspect-square rounded border",

                            "ring-accent/20 ring-0 duration-200",
                            active && "border-accent bg-accent/5 ring-2",
                          )}
                        >
                          <i className={`${icon} size-5`} />
                        </button>
                      )
                    })}
                  </div>
                </section>
              </m.div>
            )}
          </AnimatePresence>
        </HoverCard.Content>
      </RootPortal>
    </HoverCard.Root>
  )
}

export const EmptyFeedList = memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-1 items-center font-normal text-zinc-500">
      <Link
        to="/discover"
        className="cursor-menu absolute inset-0 mt-[-3.75rem] flex h-full flex-1 flex-col items-center justify-center gap-2"
        onClick={(e) => {
          stopPropagation(e)
          onClick?.(e)
        }}
      >
        <i className="i-mgc-add-cute-re text-3xl" />
        <span className="text-base">{t("sidebar.add_more_feeds")}</span>
      </Link>
    </div>
  )
})
EmptyFeedList.displayName = "EmptyFeedList"

export const StarredItem = memo(({ view }: { view: number }) => {
  const feedId = useRouteFeedId()
  const navigateEntry = useNavigateEntry()
  const { t } = useTranslation()

  return (
    <div
      data-active={feedId === FEED_COLLECTION_LIST}
      className={cn(
        "cursor-menu mt-1 flex h-8 w-full shrink-0 items-center gap-2 rounded-md px-2.5",
        feedColumnStyles.item,
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (view !== undefined) {
          navigateEntry({
            entryId: null,
            feedId: FEED_COLLECTION_LIST,
            view,
          })
        }
      }}
    >
      <i className="i-mgc-star-cute-fi size-4 -translate-y-px text-amber-500" />
      {t("words.starred")}
    </div>
  )
})
StarredItem.displayName = "StarredItem"
