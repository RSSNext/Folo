import { useMobile } from "@follow/components/hooks/useMobile.js"
import { OouiUserAnonymous } from "@follow/components/icons/OouiUserAnonymous.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import type { FeedViewType } from "@follow/constants"
import { nextFrame } from "@follow/utils/dom"
import { cn, isKeyForMultiSelectPressed } from "@follow/utils/utils"
import dayjs from "dayjs"
import { memo, useCallback, useContext, useState } from "react"
import { useTranslation } from "react-i18next"

import { MenuItemSeparator, MenuItemText, useShowContextMenu } from "~/atoms/context-menu"
import { getMainContainerElement } from "~/atoms/dom"
import { useFeedActions, useInboxActions, useListActions } from "~/hooks/biz/useFeedActions"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { useContextMenu } from "~/hooks/common/useContextMenu"
import { getNewIssueUrl } from "~/lib/issues"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { FeedTitle } from "~/modules/feed/feed-title"
import { getPreferredTitle, useFeedById } from "~/store/feed"
import { useInboxById } from "~/store/inbox"
import { useListById } from "~/store/list"
import { useSubscriptionByFeedId } from "~/store/subscription"
import { useFeedUnreadStore } from "~/store/unread"
import { useUnreadByListId } from "~/store/unread/hooks"

import { useSelectedFeedIdsState } from "./atom"
import { DraggableContext } from "./context"
import { feedColumnStyles } from "./styles"
import { UnreadNumber } from "./UnreadNumber"

interface FeedItemProps {
  feedId: string
  view?: number
  className?: string
}

const DraggableItemWrapper: Component<
  {
    className?: string
    isInMultipleSelection: boolean
  } & React.HTMLAttributes<HTMLDivElement>
> = ({ children, isInMultipleSelection, ...props }) => {
  const draggableContext = useContext(DraggableContext)

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
const FeedItemImpl = ({ view, feedId, className }: FeedItemProps) => {
  const { t } = useTranslation()
  const subscription = useSubscriptionByFeedId(feedId)!
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
      owner: feed.owner,
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
      // focus to main container in order to let keyboard can navigate entry items by arrow keys
      nextFrame(() => {
        getMainContainerElement()?.focus()
      })
    },
    [feedId, navigate, setSelectedFeedIds, view],
  )

  const feedUnread = useFeedUnreadStore((state) => state.data[feedId] || 0)

  const isActive = useRouteParamsSelector((routerParams) => routerParams.feedId === feedId)

  const items = useFeedActions({
    feedIds: selectedFeedIds,
    feedId,
    view,
  })

  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const showContextMenu = useShowContextMenu()
  const contextMenuProps = useContextMenu({
    onContextMenu: async (e) => {
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
    },
  })
  if (!feed) return null

  const isFeed = feed.type === "feed" || !feed.type

  return (
    <DraggableItemWrapper
      isInMultipleSelection={isInMultipleSelection}
      data-feed-id={feedId}
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
      onDoubleClick={() => {
        window.open(UrlBuilder.shareFeed(feedId, view), "_blank")
      }}
      {...contextMenuProps}
    >
      <div
        className={cn(
          "flex min-w-0 items-center",
          isFeed && feed.errorAt && "text-red-900 dark:text-red-500",
        )}
      >
        <FeedIcon fallback feed={feed} size={16} />
        <FeedTitle feed={feed} />
        {isFeed && feed.errorAt && (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <i className="i-mgc-wifi-off-cute-re ml-1 shrink-0 text-base" />
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent>
                <div className="flex items-center gap-1">
                  <i className="i-mgc-time-cute-re" />
                  {t("feed_item.error_since")}{" "}
                  {dayjs
                    .duration(dayjs(feed.errorAt).diff(dayjs(), "minute"), "minute")
                    .humanize(true)}
                </div>
                {!!feed.errorMessage && (
                  <div className="flex items-center gap-1">
                    <i className="i-mgc-bug-cute-re" />
                    {feed.errorMessage}
                  </div>
                )}
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        )}
        {subscription.isPrivate && (
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
      <UnreadNumber unread={feedUnread} className="ml-2" />
    </DraggableItemWrapper>
  )
}

export const FeedItem = memo(FeedItemImpl)

const ListItemImpl: Component<{
  listId: string
  view: FeedViewType
  iconSize?: number
}> = ({ view, listId, className, iconSize = 22 }) => {
  const list = useListById(listId)

  const isActive = useRouteParamsSelector((routerParams) => routerParams.listId === listId)
  const items = useListActions({ listId, view })

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
      // focus to main container in order to let keyboard can navigate entry items by arrow keys
      nextFrame(() => {
        getMainContainerElement()?.focus()
      })
    },
    [listId, navigate, view],
  )
  const showContextMenu = useShowContextMenu()
  const { t } = useTranslation()

  const contextMenuProps = useContextMenu({
    onContextMenu: async (e) => {
      setIsContextMenuOpen(true)
      await showContextMenu(items, e)
      setIsContextMenuOpen(false)
    },
  })
  if (!list) return null
  return (
    <div
      data-list-id={listId}
      data-active={isActive || isContextMenuOpen}
      className={cn(feedColumnStyles.item, "py-1 pl-2.5", className)}
      onClick={handleNavigate}
      onDoubleClick={() => {
        window.open(UrlBuilder.shareList(listId, view), "_blank")
      }}
      {...contextMenuProps}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <FeedIcon fallback feed={list} size={iconSize} />
        <EllipsisHorizontalTextWithTooltip className="truncate">
          {getPreferredTitle(list)}
        </EllipsisHorizontalTextWithTooltip>

        {subscription.isPrivate && (
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
      <UnreadNumber unread={listUnread} className="ml-2" />
    </div>
  )
}

export const ListItem = memo(ListItemImpl)

const InboxItemImpl: Component<{
  inboxId: string
  view: FeedViewType
  iconSize?: number
}> = ({ view, inboxId, className, iconSize = 16 }) => {
  const inbox = useInboxById(inboxId)

  const isActive = useRouteParamsSelector((routerParams) => routerParams.inboxId === inboxId)
  const { items } = useInboxActions({ inboxId })

  const inboxUnread = useFeedUnreadStore((state) => state.data[inboxId] || 0)

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
