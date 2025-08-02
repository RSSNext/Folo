import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import { OouiUserAnonymous } from "@follow/components/icons/OouiUserAnonymous.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import type { FeedViewType } from "@follow/constants"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById } from "@follow/store/inbox/hooks"
import { useListById } from "@follow/store/list/hooks"
import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { useUnreadById, useUnreadByListId } from "@follow/store/unread/hooks"
import { cn, isKeyForMultiSelectPressed } from "@follow/utils/utils"
import { createElement, memo, use, useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useEventCallback } from "usehooks-ts"

import { MenuItemSeparator, MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { useHideAllReadSubscriptions } from "~/atoms/settings/general"
import { ErrorTooltip } from "~/components/common/ErrorTooltip"
import { FocusablePresets } from "~/components/common/Focusable"
import { useContextMenuActionShortCutTrigger } from "~/hooks/biz/useContextMenuActionShortCutTrigger"
import { useFeedActions, useInboxActions, useListActions } from "~/hooks/biz/useFeedActions"
import { useFollow } from "~/hooks/biz/useFollow"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { getNewIssueUrl } from "~/lib/issues"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"
import { getPreferredTitle } from "~/store/feed/hooks"

import { useSelectedFeedIdsState } from "./atom"
import { DraggableContext } from "./context"
import { feedColumnStyles } from "./styles"
import { UnreadNumber } from "./UnreadNumber"

interface FeedItemProps {
  feedId: string
  view?: number
  className?: string
  isPreview?: boolean
}

const DraggableItemWrapper: Component<
  {
    className?: string
    isInMultipleSelection: boolean
  } & React.HTMLAttributes<HTMLDivElement>
> = ({ children, isInMultipleSelection, ...props }) => {
  const draggableContext = use(DraggableContext)

  return (
    <div
      {...draggableContext?.attributes}
      {...draggableContext?.listeners}
      style={isInMultipleSelection ? draggableContext?.style : undefined}
      {...props}
    >
      {children}
    </div>
  )
}
const FeedItemImpl = ({ view, feedId, className, isPreview }: FeedItemProps) => {
  const { t } = useTranslation()
  const subscription = useSubscriptionByFeedId(feedId)
  const navigate = useNavigateEntry()
  const feed = useFeedById(feedId, (feed) => {
    return {
      type: feed.type,
      id: feed.id,
      title: feed.title,
      errorAt: feed.errorAt,
      errorMessage: feed.errorMessage,
      url: feed.url,
      image: feed.image,
      siteUrl: feed.siteUrl,
      ownerUserId: feed.ownerUserId,
    }
  })

  const [selectedFeedIds, setSelectedFeedIds] = useSelectedFeedIdsState()

  const isMobile = useMobile()
  const isInMultipleSelection = !isMobile && selectedFeedIds.includes(feedId)
  const isMultiSelectingButNotSelected =
    !isMobile && selectedFeedIds.length > 0 && !isInMultipleSelection

  const handleClick: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (e) => {
      if (isKeyForMultiSelectPressed(e.nativeEvent)) {
        return
      } else {
        setSelectedFeedIds([feedId])
      }

      e.stopPropagation()
      if (view === undefined) return
      navigate({
        feedId,
        entryId: null,
        view,
      })
    },
    [feedId, navigate, setSelectedFeedIds, view],
  )

  const feedUnread = useUnreadById(feedId)

  const isActive = useRouteParamsSelector((routerParams) => routerParams.feedId === feedId)

  const items = useFeedActions({
    feedIds: selectedFeedIds,
    feedId,
    view,
  })

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isSubscriptionList)

  const whenTrigger = when && isActive
  useContextMenuActionShortCutTrigger(items, whenTrigger)

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const showContextMenu = useShowContextMenu()
  const contextMenuProps = useContextMenu({
    onContextMenu: useEventCallback(async (e) => {
      const nextItems = items.concat()

      if (!feed) return
      if (isFeed && feed.errorAt && feed.errorMessage) {
        nextItems.push(
          MenuItemSeparator.default,
          new MenuItemText({
            label: "Feedback",
            click: () => {
              window.open(
                getNewIssueUrl({
                  body:
                    `### Error\n\nError Message: ${feed.errorMessage}\n\n### Info\n\n` +
                    `\`\`\`json\n${JSON.stringify(feed, null, 2)}\n\`\`\``,
                  label: "bug",
                  title: `Feed Error: ${feed.title}, ${feed.errorMessage}`,
                  target: "discussion",
                  category: "feed-expired",
                }),
              )
            },
          }),
        )
      }
      setIsContextMenuOpen(true)
      await showContextMenu(nextItems, e)
      setIsContextMenuOpen(false)
    }),
  })
  const follow = useFollow()
  const handleDoubleClick = useEventCallback(() => {
    window.open(UrlBuilder.shareFeed(feedId, view), "_blank")
  })

  if (!feed) return null

  const isFeed = feed.type === "feed" || !feed.type

  return (
    <DraggableItemWrapper
      isInMultipleSelection={isInMultipleSelection}
      data-feed-id={feedId}
      data-sub={`feed-${feedId}`}
      data-active={
        isMultiSelectingButNotSelected
          ? false
          : isActive || isContextMenuOpen || isInMultipleSelection
      }
      className={cn(
        feedColumnStyles.item,
        isFeed ? "py-0.5" : "py-1.5",
        "justify-between py-0.5",
        className,
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...contextMenuProps}
    >
      <div className={cn("flex min-w-0 items-center", isFeed && feed.errorAt && "text-red")}>
        <FeedIcon fallback feed={feed} size={16} />
        <FeedTitle feed={feed} />
        {isFeed && (
          <ErrorTooltip errorAt={feed.errorAt} errorMessage={feed.errorMessage}>
            <i className="i-mingcute-close-circle-fill ml-1 shrink-0 text-base" />
          </ErrorTooltip>
        )}
        {subscription?.isPrivate && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger>
              <OouiUserAnonymous className="ml-1 shrink-0 text-base" />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>{t("feed_item.not_publicly_visible")}</TooltipContent>
            </TooltipPortal>
          </Tooltip>
        )}
      </div>
      {isPreview ? (
        <Button
          size="sm"
          variant="ghost"
          buttonClassName="!p-1 mr-0.5"
          onClick={() => {
            follow({
              isList: false,
              id: feedId,
              url: feed.url,
            })
          }}
        >
          <i className="i-mgc-add-cute-re text-accent text-base" />
        </Button>
      ) : (
        <UnreadNumber unread={feedUnread} className="ml-2" />
      )}
    </DraggableItemWrapper>
  )
}

const FilterReadFeedItem: Component<FeedItemProps> = (props) => {
  const feedUnread = useUnreadById(props.feedId)

  if (!feedUnread) return null
  return createElement(FeedItemImpl, props)
}

export const FeedItem = memo(FeedItemImpl)

export const FeedItemAutoHideUnread: Component<FeedItemProps> = memo((props) => {
  const hideAllReadSubscriptions = useHideAllReadSubscriptions()
  if (hideAllReadSubscriptions) return createElement(FilterReadFeedItem, props)
  return createElement(FeedItemImpl, props)
})

interface ListItemProps {
  listId: string
  view: FeedViewType
  iconSize?: number
  isPreview?: boolean
}

const ListItemImpl: Component<ListItemProps> = ({
  view,
  listId,
  className,
  iconSize = 22,
  isPreview,
}) => {
  const list = useListById(listId)

  const isActive = useRouteParamsSelector((routerParams) => routerParams.listId === listId)
  const items = useListActions({ listId, view })

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isSubscriptionList)
  useContextMenuActionShortCutTrigger(items, when && isActive)

  const listUnread = useUnreadByListId(listId)

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const subscription = useSubscriptionByFeedId(listId)!
  const navigate = useNavigateEntry()
  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()

      navigate({
        listId,
        entryId: null,
        view,
      })
    },
    [listId, navigate, view],
  )
  const showContextMenu = useShowContextMenu()
  const { t } = useTranslation()

  const contextMenuProps = useContextMenu({
    onContextMenu: useEventCallback(async (e) => {
      setIsContextMenuOpen(true)
      await showContextMenu(items, e)
      setIsContextMenuOpen(false)
    }),
  })
  const follow = useFollow()
  const handleDoubleClick = useEventCallback(() => {
    window.open(UrlBuilder.shareList(listId, view), "_blank")
  })

  if (!list) return null
  return (
    <div
      data-list-id={listId}
      data-sub={`list-${listId}`}
      data-active={isActive || isContextMenuOpen}
      className={cn(feedColumnStyles.item, "py-1 pl-2.5", className)}
      onClick={handleNavigate}
      onDoubleClick={handleDoubleClick}
      {...contextMenuProps}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <FeedIcon fallback feed={list} size={iconSize} className="mask mask-squircle" />
        <EllipsisHorizontalTextWithTooltip className="truncate">
          {getPreferredTitle(list)}
        </EllipsisHorizontalTextWithTooltip>

        {subscription?.isPrivate && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger>
              <OouiUserAnonymous className="ml-1 shrink-0 text-base" />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>{t("feed_item.not_publicly_visible")}</TooltipContent>
            </TooltipPortal>
          </Tooltip>
        )}
      </div>
      {isPreview ? (
        <Button
          size="sm"
          variant="ghost"
          buttonClassName="!p-1 mr-0.5"
          onClick={() => {
            follow({
              isList: true,
              id: listId,
            })
          }}
        >
          <i className="i-mgc-add-cute-re text-accent text-base" />
        </Button>
      ) : (
        <UnreadNumber unread={listUnread} className="ml-2" />
      )}
    </div>
  )
}

export const ListItem = memo(ListItemImpl)

const FilterReadListItem: Component<ListItemProps> = (props) => {
  const listUnread = useUnreadByListId(props.listId)

  if (!listUnread) return null
  return createElement(ListItem, props)
}

export const ListItemAutoHideUnread: Component<ListItemProps> = memo((props) => {
  const hideAllReadSubscriptions = useHideAllReadSubscriptions()

  if (hideAllReadSubscriptions) return createElement(FilterReadListItem, props)
  return createElement(ListItemImpl, props)
})

interface InboxItemProps {
  inboxId: string
  view: FeedViewType
  iconSize?: number
}
const InboxItemImpl: Component<InboxItemProps> = ({ view, inboxId, className, iconSize = 16 }) => {
  const inbox = useInboxById(inboxId)

  const isActive = useRouteParamsSelector((routerParams) => routerParams.inboxId === inboxId)
  const { items } = useInboxActions({ inboxId })

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isSubscriptionList)
  useContextMenuActionShortCutTrigger(items, when && isActive)

  const inboxUnread = useUnreadById(inboxId)

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const navigate = useNavigateEntry()
  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()

      navigate({
        inboxId,
        entryId: null,
        view,
      })
    },
    [inboxId, navigate, view],
  )
  const showContextMenu = useShowContextMenu()

  const contextMenuProps = useContextMenu({
    onContextMenu: async (e) => {
      setIsContextMenuOpen(true)
      await showContextMenu(items, e)
      setIsContextMenuOpen(false)
    },
  })
  if (!inbox) return null
  return (
    <div
      data-active={isActive || isContextMenuOpen}
      data-sub={`inbox-${inboxId}`}
      data-inbox-id={inboxId}
      className={cn(
        "cursor-menu flex w-full items-center justify-between rounded-md pr-2.5 text-base font-medium leading-loose lg:text-sm",
        feedColumnStyles.item,
        "py-0.5 pl-2.5",
        className,
      )}
      onClick={handleNavigate}
      {...contextMenuProps}
    >
      <div className={"flex min-w-0 items-center"}>
        <FeedIcon fallback feed={inbox} size={iconSize} />
        <EllipsisHorizontalTextWithTooltip className="truncate">
          {getPreferredTitle(inbox)}
        </EllipsisHorizontalTextWithTooltip>
      </div>
      <UnreadNumber unread={inboxUnread} className="ml-2" />
    </div>
  )
}

export const InboxItem = memo(InboxItemImpl)
