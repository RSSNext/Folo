import { useDraggable } from "@dnd-kit/core"
import {
  useFocusableContainerRef,
  useFocusActions,
  useGlobalFocusableScopeSelector,
} from "@follow/components/common/Focusable/hooks.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { FeedViewType } from "@follow/constants"
import { useInboxList } from "@follow/store/inbox/hooks"
import { useListById } from "@follow/store/list/hooks"
import {
  useCategoryOpenStateByView,
  useFeedsGroupedData,
  useSubscriptionListIds,
} from "@follow/store/subscription/hooks"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { cn, combineCleanupFunctions, isKeyForMultiSelectPressed } from "@follow/utils/utils"
import { memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import Selecto from "react-selecto"
import { useEventCallback, useEventListener } from "usehooks-ts"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { FocusablePresets } from "~/components/common/Focusable"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { useFeedQuery } from "~/queries/feed"

import { COMMAND_ID } from "../command/commands/id"
import { useCommandBinding } from "../command/hooks/use-command-binding"
import { useCommandHotkey } from "../command/hooks/use-register-hotkey"
import { useIsPreviewFeed } from "../entry-column/hooks/useIsPreviewFeed"
import {
  resetSelectedFeedIds,
  setFeedAreaScrollProgressValue,
  setSelectedFeedIds,
  useSelectedFeedIdsState,
} from "./atom"
import { DraggableContext } from "./context"
import { FeedItem, ListItemAutoHideUnread } from "./FeedItem"
import { useShouldFreeUpSpace } from "./hook"
import { SortableFeedList, SortByAlphabeticalInbox, SortByAlphabeticalList } from "./sort-by"
import type { SubscriptionProps } from "./SubscriptionList.entry"
import { EmptyFeedList, ListHeader, StarredItem } from "./SubscriptionList.shared"

const SubscriptionImpl = ({ ref, className, view }: SubscriptionProps) => {
  const autoGroup = useGeneralSettingKey("autoGroup")
  const feedsData = useFeedsGroupedData(view, autoGroup)
  const listSubIds = useSubscriptionListIds(view)
  const inboxSubIds = useInboxList(
    useCallback(
      (inboxes) => (view === FeedViewType.Articles ? inboxes.map((inbox) => inbox.id) : []),
      [view],
    ),
  )

  const categoryOpenStateData = useCategoryOpenStateByView(view)

  const hasData =
    Object.keys(feedsData).length > 0 || listSubIds.length > 0 || inboxSubIds.length > 0

  const { t } = useTranslation()

  // Data prefetch
  // useAuthQuery(Queries.lists.list())

  const hasListData = listSubIds.length > 0
  const hasInboxData = inboxSubIds.length > 0

  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const selectoRef = useRef<Selecto>(null)
  const [selectedFeedIds, setSelectedFeedIds] = useSelectedFeedIdsState()
  const [currentStartFeedId, setCurrentStartFeedId] = useState<string | null>(null)
  useEffect(() => {
    if (selectedFeedIds.length <= 1) {
      setCurrentStartFeedId(null)
    }
  }, [selectedFeedIds])

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: "selected-feed",
    disabled: selectedFeedIds.length === 0,
  })
  const style = useMemo(
    () =>
      transform
        ? ({
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            transitionDuration: "0",
            transition: "none",
          } as React.CSSProperties)
        : undefined,
    [transform],
  )

  const draggableContextValue = useMemo(
    () => ({
      attributes,
      listeners,
      style: {
        ...style,
        willChange: "transform",
      },
    }),
    [attributes, listeners, style],
  )

  useImperativeHandle(ref, () => scrollerRef.current!)

  useEventListener(
    "scroll",
    () => {
      const round = (num: number) => Math.round(num * 1e2) / 1e2
      const getPositions = () => {
        const el = scrollerRef.current
        if (!el) return

        return {
          x: round(el.scrollLeft / (el.scrollWidth - el.clientWidth)),
          y: round(el.scrollTop / (el.scrollHeight - el.clientHeight)),
        }
      }

      const newScrollValues = getPositions()
      if (!newScrollValues) return

      const { y } = newScrollValues
      setFeedAreaScrollProgressValue(y)
    },
    scrollerRef as React.RefObject<HTMLElement>,
    { capture: false, passive: true },
  )

  const shouldFreeUpSpace = useShouldFreeUpSpace()

  const routerParams = useRouteParams()
  const { listId, feedId } = routerParams
  const isPreview = useIsPreviewFeed()
  const isFeedPreview = isPreview && !listId
  const isListPreview = isPreview && listId

  useFeedQuery({ id: isFeedPreview ? feedId : undefined })
  useListById(isListPreview ? listId : undefined)

  useRegisterCommand()

  return (
    <div className={cn(className, "font-medium")}>
      <ListHeader view={view} />
      <Selecto
        className="!border-theme-accent-400 !bg-theme-accent-400/60"
        ref={selectoRef}
        rootContainer={document.body}
        dragContainer={"#feeds-area"}
        dragCondition={(e) => {
          const inputEvent = e.inputEvent as MouseEvent
          const target = inputEvent.target as HTMLElement
          const closest = target.closest("[data-feed-id]") as HTMLElement | null
          const dataFeedId = closest?.dataset.feedId

          if (
            dataFeedId &&
            selectedFeedIds.includes(dataFeedId) &&
            !isKeyForMultiSelectPressed(inputEvent)
          )
            return false

          return true
        }}
        onDragStart={(e) => {
          if (!isKeyForMultiSelectPressed(e.inputEvent as MouseEvent)) {
            resetSelectedFeedIds()
          }
        }}
        selectableTargets={["[data-feed-id]"]}
        continueSelect
        hitRate={1}
        onSelect={(e) => {
          const allChanged = [...e.added, ...e.removed]
            .map((el) => el.dataset.feedId)
            .filter((id) => id !== undefined)
          const added = allChanged.filter((id) => !selectedFeedIds.includes(id))
          const removed = allChanged.filter((id) => selectedFeedIds.includes(id))

          if (isKeyForMultiSelectPressed(e.inputEvent as MouseEvent)) {
            const allVisible = Array.from(document.querySelectorAll("[data-feed-id]")).map(
              (el) => (el as HTMLElement).dataset.feedId,
            )
            const currentSelected =
              added.length === 1 ? added[0] : removed.length === 1 ? removed[0] : null
            const currentIndex = currentSelected ? allVisible.indexOf(currentSelected) : -1

            // command or ctrl with click, update start feed id
            if (!(e.inputEvent as MouseEvent).shiftKey && currentSelected) {
              setCurrentStartFeedId(currentSelected)
            }

            // shift with click, select all between
            if ((e.inputEvent as MouseEvent).shiftKey && currentSelected) {
              const firstSelected = currentStartFeedId ?? selectedFeedIds[0]
              if (firstSelected) {
                const firstIndex = allVisible.indexOf(firstSelected)
                const order =
                  firstIndex < currentIndex
                    ? [firstIndex, currentIndex]
                    : [currentIndex, firstIndex]
                const between = allVisible.slice(order[0], order[1]! + 1) as string[]
                setSelectedFeedIds((prev) => {
                  // with intersection, we need to update selected ids as between
                  // otherwise, we need to add between to selected ids
                  const hasIntersection = between.slice(1, -1).some((id) => prev.includes(id))
                  return [
                    ...(hasIntersection ? prev.filter((id) => between.includes(id)) : prev),
                    ...between,
                  ]
                })
                return
              }
            }
          }

          setSelectedFeedIds((prev) => {
            return [...prev.filter((id) => !removed.includes(id)), ...added]
          })
        }}
        scrollOptions={{
          container: scrollerRef.current as HTMLElement,
          throttleTime: 30,
          threshold: 0,
        }}
        onScroll={(e) => {
          scrollerRef.current?.scrollBy(e.direction[0]! * 10, e.direction[1]! * 10)
        }}
      />

      <ScrollArea.ScrollArea
        focusable={false}
        ref={scrollerRef}
        onScroll={() => {
          selectoRef.current?.checkScroll()
        }}
        mask={false}
        flex
        viewportClassName={cn("!px-3", shouldFreeUpSpace && "!overflow-visible")}
        rootClassName={cn("h-full", shouldFreeUpSpace && "overflow-visible")}
      >
        <StarredItem view={view} />
        {(hasListData || (isListPreview && listId)) && (
          <>
            <div className="text-text-secondary mt-1 flex h-6 w-full shrink-0 items-center rounded-md px-2.5 text-xs font-semibold transition-colors">
              {t("words.lists")}
            </div>
            {isListPreview && listId && (
              <ListItemAutoHideUnread
                listId={listId}
                view={view}
                className="pl-2.5 pr-0"
                isPreview
              />
            )}
            <SortByAlphabeticalList view={view} data={listSubIds} />
          </>
        )}
        {hasInboxData && (
          <>
            <div className="text-text-secondary mt-1 flex h-6 w-full shrink-0 items-center rounded-md px-2.5 text-xs font-semibold transition-colors">
              {t("words.inbox")}
            </div>
            <SortByAlphabeticalInbox view={view} data={inboxSubIds} />
          </>
        )}

        {(hasListData || hasInboxData) && (
          <div
            className={cn(
              "text-text-secondary mb-1 flex h-6 w-full shrink-0 items-center rounded-md px-2.5 text-xs font-semibold transition-colors",
              Object.keys(feedsData).length === 0 ? "mt-0" : "mt-1",
            )}
          >
            {t("words.feeds")}
          </div>
        )}
        {isFeedPreview && feedId && (
          <FeedItem feedId={feedId} view={view} className="pl-2.5 pr-0.5" isPreview />
        )}
        <DraggableContext value={draggableContextValue}>
          <div className="space-y-px" id="feeds-area" ref={setNodeRef}>
            {hasData ? (
              <SortableFeedList
                view={view}
                data={feedsData}
                categoryOpenStateData={categoryOpenStateData}
              />
            ) : (
              <EmptyFeedList />
            )}
          </div>
        </DraggableContext>
      </ScrollArea.ScrollArea>
    </div>
  )
}

SubscriptionImpl.displayName = "FeedListImpl"

export const SubscriptionList = memo(SubscriptionImpl)

const FeedCategoryPrefix = "feed-category-"

const useRegisterCommand = () => {
  const focusableContainerRef = useFocusableContainerRef()

  const focusActions = useFocusActions()

  const inSubscriptionScope = useGlobalFocusableScopeSelector(FocusablePresets.isSubscriptionList)

  useCommandBinding({
    commandId: COMMAND_ID.subscription.nextSubscription,
    when: inSubscriptionScope,
  })

  useCommandBinding({
    commandId: COMMAND_ID.subscription.previousSubscription,
    when: inSubscriptionScope,
  })

  useCommandHotkey({
    commandId: COMMAND_ID.layout.focusToTimeline,
    when: inSubscriptionScope,
    shortcut: "Enter, L, ArrowRight",
  })

  useCommandBinding({
    commandId: COMMAND_ID.subscription.toggleFolderCollapse,
    when: inSubscriptionScope,
  })

  const getCurrentActiveSubscriptionElement = useEventCallback(() => {
    const container = focusableContainerRef.current
    if (!container) return

    const allSubscriptions = Array.from(container.querySelectorAll("[data-sub]"))
    if (allSubscriptions.length === 0) return

    const currentActive = container.querySelector("[data-active=true]")

    return [currentActive as HTMLElement | null, allSubscriptions] as const
  })

  useEffect(() => {
    const handleSubscriptionNavigation = (direction: "next" | "previous") => {
      const result = getCurrentActiveSubscriptionElement()
      if (!result) return

      const [currentActive, allSubscriptions] = result

      if (!currentActive) {
        // If no active item, select first or last based on direction
        const defaultIndex = direction === "next" ? 0 : -1
        ;(allSubscriptions.at(defaultIndex) as HTMLElement)?.click()
        return
      }

      const currentIndex = allSubscriptions.indexOf(currentActive)
      let targetIndex: number

      if (direction === "next") {
        targetIndex = (currentIndex + 1) % allSubscriptions.length
      } else {
        targetIndex = (currentIndex - 1 + allSubscriptions.length) % allSubscriptions.length
      }

      const targetElement = allSubscriptions[targetIndex] as HTMLElement | null

      // Cleanup selected feed
      const targetIsCategoryOrFolder = targetElement?.dataset.sub?.startsWith(FeedCategoryPrefix)
      if (targetIsCategoryOrFolder) {
        setSelectedFeedIds([])
      }
      targetElement?.click()
    }

    return combineCleanupFunctions(
      EventBus.subscribe(COMMAND_ID.subscription.nextSubscription, () => {
        handleSubscriptionNavigation("next")
      }),
      EventBus.subscribe(COMMAND_ID.subscription.previousSubscription, () => {
        handleSubscriptionNavigation("previous")
      }),
      EventBus.subscribe(COMMAND_ID.layout.focusToSubscription, ({ highlightBoundary }) => {
        focusableContainerRef.current?.focus()
        if (highlightBoundary) {
          nextFrame(() => {
            focusActions.highlightBoundary()
          })
        }
      }),
      EventBus.subscribe(COMMAND_ID.subscription.toggleFolderCollapse, () => {
        const result = getCurrentActiveSubscriptionElement()
        if (!result) return

        const [currentActive] = result

        if (currentActive?.dataset.sub?.startsWith(FeedCategoryPrefix)) {
          setSelectedFeedIds([])
          ;(currentActive.querySelector('[data-type="collapse"]') as HTMLElement | null)?.click()
        }
      }),
    )
  }, [focusableContainerRef, focusActions, getCurrentActiveSubscriptionElement])
}
