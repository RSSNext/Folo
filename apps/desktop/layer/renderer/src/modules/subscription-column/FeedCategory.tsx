import { useDroppable } from "@dnd-kit/core"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { useInputComposition, useRefValue } from "@follow/hooks"
import { useFeedStore } from "@follow/store/feed/store"
import { useOwnedListByView } from "@follow/store/list/hooks"
import {
  useSubscriptionByFeedId,
  useSubscriptionCategoryExist,
} from "@follow/store/subscription/hooks"
import { subscriptionActions, subscriptionSyncService } from "@follow/store/subscription/store"
import { getDefaultCategory } from "@follow/store/subscription/utils"
import { useSortedIdsByUnread, useUnreadByIds } from "@follow/store/unread/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { stopPropagation } from "@follow/utils/dom"
import { cn, sortByAlphabet } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useEventCallback, useOnClickOutside } from "usehooks-ts"

import type { MenuItemInput } from "~/atoms/context-menu"
import { MenuItemSeparator, MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { useGeneralSettingSelector, useHideAllReadSubscriptions } from "~/atoms/settings/general"
import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { useAddFeedToFeedList } from "~/hooks/biz/useFeedActions"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { createErrorToaster } from "~/lib/error-parser"
import { getPreferredTitle } from "~/store/feed/hooks"

import { useModalStack } from "../../components/ui/modal/stacked/hooks"
import { ListCreationModalContent } from "../settings/tabs/lists/modals"
import { useFeedListSortSelector } from "./atom"
import { CategoryRemoveDialogContent } from "./CategoryRemoveDialogContent"
import { FeedItemAutoHideUnread } from "./FeedItem"
import { feedColumnStyles } from "./styles"
import { UnreadNumber } from "./UnreadNumber"

type FeedId = string
interface FeedCategoryProps {
  data: FeedId[]
  view: FeedViewType
  categoryOpenStateData: Record<string, boolean>
}

function FeedCategoryImpl({ data: ids, view, categoryOpenStateData }: FeedCategoryProps) {
  const { t } = useTranslation()

  const sortByUnreadFeedList = useSortedIdsByUnread(ids)

  const navigate = useNavigateEntry()

  const subscription = useSubscriptionByFeedId(ids[0]!)!
  const autoGroup = useGeneralSettingSelector((state) => state.autoGroup)
  const folderName =
    subscription?.category || (autoGroup ? getDefaultCategory(subscription) : subscription.feedId)

  const isCategory = sortByUnreadFeedList.length > 1 || !!subscription?.category

  const open = useMemo(() => {
    if (!isCategory) return true
    if (folderName && typeof categoryOpenStateData[folderName] === "boolean") {
      return categoryOpenStateData[folderName]
    }
    return false
  }, [categoryOpenStateData, folderName, isCategory])

  const setOpen = useCallback(
    (next: boolean) => {
      if (view !== undefined && folderName) {
        subscriptionActions.changeCategoryOpenState(view, folderName, next)
      }
    },
    [folderName, view],
  )

  const shouldOpen = useRouteParamsSelector(
    (s) => typeof s.feedId === "string" && ids.includes(s.feedId),
  )
  const scroller = useScrollViewElement()
  const scrollerRef = useRefValue(scroller)
  useEffect(() => {
    if (shouldOpen) {
      setOpen(true)

      const $items = itemsRef.current

      if (!$items) return
      const $target = $items.querySelector(
        `[data-feed-id="${getRouteParams().feedId}"]`,
      ) as HTMLElement
      if (!$target) return

      const $scroller = scrollerRef.current
      if (!$scroller) return

      const scrollTop = $target.offsetTop - $scroller.clientHeight / 2
      $scroller.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      })
    }
  }, [scrollerRef, setOpen, shouldOpen])

  const itemsRef = useRef<HTMLDivElement>(null)

  const isMobile = useMobile()
  const toggleCategoryOpenState = useEventCallback(
    (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
      e.stopPropagation()
      if (!isCategoryEditing && !isMobile) {
        setCategoryActive()
      }
      if (view !== undefined && folderName) {
        subscriptionActions.toggleCategoryOpenState(view, folderName)
      }
    },
  )

  const handleCollapseButtonClick = useEventCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (view !== undefined && folderName) {
      subscriptionActions.toggleCategoryOpenState(view, folderName)
    }
  })

  const setCategoryActive = () => {
    if (view !== undefined) {
      navigate({
        entryId: null,
        folderName,
        view,
      })
    }
  }

  const unread = useUnreadByIds(ids)

  const isActive = useRouteParamsSelector(
    (routerParams) => routerParams.feedId === `${ROUTE_FEED_IN_FOLDER}${folderName}`,
  )
  const { present } = useModalStack()

  const { mutateAsync: changeCategoryView, isPending: isChangePending } = useMutation({
    mutationKey: ["changeCategoryView", folderName, view],
    mutationFn: async (nextView: FeedViewType) => {
      if (!folderName) return
      if (typeof view !== "number") return
      return subscriptionSyncService.changeCategoryView({
        category: folderName,
        currentView: view,
        newView: nextView,
      })
    },
  })

  const [isCategoryEditing, setIsCategoryEditing] = useState(false)
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const isCategoryIsWaiting = isChangePending

  const addMutation = useAddFeedToFeedList()

  const listList = useOwnedListByView(view!)
  const showContextMenu = useShowContextMenu()

  const subscriptionCategoryExist = useSubscriptionCategoryExist(folderName)
  const isAutoGroupedCategory = !!folderName && !subscriptionCategoryExist

  const { isOver, setNodeRef } = useDroppable({
    id: `category-${folderName}`,
    disabled: isAutoGroupedCategory,
    data: {
      category: folderName,
      view,
    },
  })

  const contextMenuProps = useContextMenu({
    onContextMenu: async (e) => {
      setIsContextMenuOpen(true)
      await showContextMenu(
        [
          new MenuItemText({
            label: t("sidebar.feed_column.context_menu.mark_as_read"),
            click: () => {
              unreadSyncService.markFeedAsRead(ids)
            },
          }),
          new MenuItemSeparator(),
          new MenuItemText({
            label: t("sidebar.feed_column.context_menu.add_feeds_to_list"),
            submenu: listList
              ?.map(
                (list) =>
                  new MenuItemText({
                    label: list.title || "",
                    click() {
                      return addMutation.mutate({
                        feedIds: ids,
                        listId: list.id,
                      })
                    },
                  }) as MenuItemInput,
              )
              .concat(listList?.length > 0 ? [new MenuItemSeparator()] : [])
              .concat([
                new MenuItemText({
                  label: t("sidebar.feed_actions.create_list"),
                  click: () => {
                    present({
                      title: t("sidebar.feed_actions.create_list"),
                      content: () => <ListCreationModalContent />,
                    })
                  },
                }),
              ]),
          }),
          MenuItemSeparator.default,
          new MenuItemText({
            label: t("sidebar.feed_column.context_menu.change_to_other_view"),
            submenu: views
              .filter((v) => v.view !== view)
              .map(
                (v) =>
                  new MenuItemText({
                    label: t(v.name, { ns: "common" }),
                    shortcut: (v.view + 1).toString(),
                    icon: v.icon,
                    click() {
                      return changeCategoryView(v.view)
                    },
                  }),
              ),
          }),
          new MenuItemText({
            label: t("sidebar.feed_column.context_menu.rename_category"),
            click: () => {
              setIsCategoryEditing(true)
            },
          }),
          new MenuItemText({
            label: t("sidebar.feed_column.context_menu.delete_category"),
            hide: !folderName || isAutoGroupedCategory,
            click: () => {
              present({
                title: t("sidebar.feed_column.context_menu.delete_category_confirmation", {
                  folderName,
                }),
                content: () => <CategoryRemoveDialogContent category={folderName!} view={view} />,
              })
            },
          }),
        ],
        e,
      )

      setIsContextMenuOpen(false)
    },
  })
  return (
    <div tabIndex={-1} onClick={stopPropagation}>
      {!!isCategory && (
        <div
          ref={setNodeRef}
          data-active={isActive || isContextMenuOpen}
          className={cn(
            isOver && "border-theme-accent-400 bg-theme-accent-400/60",
            "my-px px-2.5",
            feedColumnStyles.item,
          )}
          data-sub={`feed-category-${folderName}`}
          onClick={(e) => {
            e.stopPropagation()
            if (!isCategoryEditing) {
              setCategoryActive()
            }
          }}
          {...contextMenuProps}
        >
          <div className="flex w-full min-w-0 items-center" onDoubleClick={toggleCategoryOpenState}>
            <button
              data-type="collapse"
              type="button"
              onClick={handleCollapseButtonClick}
              data-state={open ? "open" : "close"}
              className={cn(
                "flex h-8 items-center [&_.i-mgc-right-cute-fi]:data-[state=open]:rotate-90",
              )}
              tabIndex={-1}
            >
              {isCategoryIsWaiting ? (
                <LoadingCircle size="small" className="mr-2 size-[16px]" />
              ) : isCategoryEditing ? (
                <MotionButtonBase
                  onClick={() => {
                    setIsCategoryEditing(false)
                  }}
                  className="center hover:bg-material-ultra-thick -ml-1 flex size-5 shrink-0 rounded-lg"
                >
                  <i className="i-mgc-close-cute-re text-red" />
                </MotionButtonBase>
              ) : (
                <div className="center mr-2 size-[16px]">
                  <i className="i-mgc-right-cute-fi transition-transform" />
                </div>
              )}
            </button>
            {isCategoryEditing ? (
              <RenameCategoryForm
                currentCategory={folderName!}
                view={view}
                onFinished={() => setIsCategoryEditing(false)}
              />
            ) : (
              <Fragment>
                <span className="grow truncate">{folderName}</span>

                <UnreadNumber unread={unread} className="ml-2" />
              </Fragment>
            )}
          </div>
        </div>
      )}
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            ref={itemsRef}
            className="space-y-px"
            initial={
              !!isCategory && {
                height: 0,
                opacity: 0.01,
              }
            }
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0.01,
            }}
          >
            <SortedFeedItems
              ids={ids}
              showCollapse={isCategory as boolean}
              view={view as FeedViewType}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FilterReadFeedCategory(props: FeedCategoryProps) {
  const unread = useUnreadByIds(props.data)
  if (!unread) return null
  return <FeedCategoryImpl {...props} />
}

export const FeedCategoryAutoHideUnread = memo(function FeedCategoryAutoHideUnread(
  props: FeedCategoryProps,
) {
  const hideAllReadSubscriptions = useHideAllReadSubscriptions()
  if (hideAllReadSubscriptions) {
    return <FilterReadFeedCategory {...props} />
  }
  return <FeedCategoryImpl {...props} />
})

const RenameCategoryForm: FC<{
  currentCategory: string
  view: FeedViewType
  onFinished: () => void
}> = ({ currentCategory, view, onFinished }) => {
  const navigate = useNavigateEntry()
  const { t } = useTranslation()
  const renameMutation = useMutation({
    mutationFn: async ({
      lastCategory,
      newCategory,
    }: {
      lastCategory: string
      newCategory: string
    }) => subscriptionSyncService.renameCategory({ lastCategory, newCategory, view }),
    onMutate({ lastCategory, newCategory }) {
      const routeParams = getRouteParams()

      if (routeParams.folderName === lastCategory) {
        navigate({
          folderName: newCategory,
        })
      }

      onFinished()
    },
    onError: createErrorToaster(t("sidebar.feed_column.context_menu.rename_category_error")),
    onSuccess: () => {
      toast.success(t("sidebar.feed_column.context_menu.rename_category_success"))
    },
  })
  const formRef = useRef<HTMLFormElement | null>(null)
  useOnClickOutside(
    formRef as React.RefObject<HTMLElement>,
    () => {
      onFinished()
    },
    "mousedown",
  )
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  const compositionInputProps = useInputComposition({
    onKeyDown: (e) => {
      if (e.key === "Escape") {
        onFinished()
      }
    },
  })
  return (
    <form
      ref={formRef}
      className="ml-3 flex w-full items-center"
      onSubmit={(e) => {
        e.preventDefault()

        return renameMutation.mutateAsync({
          lastCategory: currentCategory!,
          newCategory: e.currentTarget.category.value,
        })
      }}
    >
      <input
        {...compositionInputProps}
        ref={inputRef}
        name="category"
        autoFocus
        defaultValue={currentCategory}
        className="caret-accent w-full appearance-none bg-transparent"
      />
      <MotionButtonBase
        type="submit"
        className="center hover:bg-material-ultra-thick text-green -mr-1 flex size-5 shrink-0 rounded-lg"
      >
        <i className="i-mgc-check-filled size-3" />
      </MotionButtonBase>
    </form>
  )
}

type SortListProps = {
  ids: string[]
  view: FeedViewType
  showCollapse: boolean
}
const SortedFeedItems = memo((props: SortListProps) => {
  const by = useFeedListSortSelector((s) => s.by)
  switch (by) {
    case "count": {
      return <SortByUnreadList {...props} />
    }
    case "alphabetical": {
      return <SortByAlphabeticalList {...props} />
    }

    default: {
      return <SortByUnreadList {...props} />
    }
  }
})

const SortByAlphabeticalList = (props: SortListProps) => {
  const { ids, showCollapse, view } = props
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")
  const sortedFeedList = useFeedStore(
    useCallback(
      (state) => {
        const res = ids.sort((a, b) => {
          const feedTitleA = getPreferredTitle(state.feeds[a]) || ""
          const feedTitleB = getPreferredTitle(state.feeds[b]) || ""
          return sortByAlphabet(feedTitleA, feedTitleB)
        })

        if (isDesc) {
          return res
        }
        return res.reverse()
      },
      [ids, isDesc],
    ),
  )
  return (
    <Fragment>
      {sortedFeedList.map((feedId) => (
        <FeedItemAutoHideUnread
          key={feedId}
          feedId={feedId}
          view={view}
          className={showCollapse ? "pl-6" : "pl-2.5"}
        />
      ))}
    </Fragment>
  )
}
const SortByUnreadList = ({ ids, showCollapse, view }: SortListProps) => {
  const isDesc = useFeedListSortSelector((s) => s.order === "desc")
  const sortByUnreadFeedList = useSortedIdsByUnread(ids, isDesc)

  return (
    <Fragment>
      {sortByUnreadFeedList.map((feedId) => (
        <FeedItemAutoHideUnread
          key={feedId}
          feedId={feedId}
          view={view}
          className={showCollapse ? "pl-6" : "pl-2.5"}
        />
      ))}
    </Fragment>
  )
}
