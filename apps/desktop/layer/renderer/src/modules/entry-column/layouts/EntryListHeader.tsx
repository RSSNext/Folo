import { ActionButton, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/index.js"
import { RotatingRefreshIcon } from "@follow/components/ui/loading/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { FeedViewType, getView } from "@follow/constants"
import { useIsOnline } from "@follow/hooks"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { useWhoami } from "@follow/store/user/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { clsx, cn, isBizId } from "@follow/utils/utils"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { previewBackPath } from "~/atoms/preview"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useSubscriptionColumnShow } from "~/atoms/sidebar"
import { ROUTE_ENTRY_PENDING } from "~/constants"
import { useFollow } from "~/hooks/biz/useFollow"
import { getRouteParams, useRouteParams } from "~/hooks/biz/useRouteParams"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useRunCommandFn } from "~/modules/command/hooks/use-command"
import { useCommandShortcut } from "~/modules/command/hooks/use-command-binding"
import { EntryHeader } from "~/modules/entry-content/components/entry-header"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { useRefreshFeedMutation } from "~/queries/feed"
import { useFeedHeaderIcon, useFeedHeaderTitle } from "~/store/feed/hooks"

import { MarkAllReadButton } from "../components/mark-all-button"
import { useIsPreviewFeed } from "../hooks/useIsPreviewFeed"
import { useEntryRootState } from "../store/EntryColumnContext"
import { AppendTaildingDivider } from "./AppendTaildingDivider"
import { SwitchToMasonryButton } from "./buttons/SwitchToMasonryButton"

export const EntryListHeader: FC<{
  refetch: () => void
  isRefreshing: boolean
  hasUpdate: boolean
}> = ({ refetch, isRefreshing, hasUpdate }) => {
  const routerParams = useRouteParams()
  const { t } = useTranslation()

  const unreadOnly = useGeneralSettingKey("unreadOnly")

  const { feedId, entryId, view, isCollection } = routerParams
  const isPreview = useIsPreviewFeed()

  const headerTitle = useFeedHeaderTitle()
  const feedIcon = useFeedHeaderIcon()

  const titleInfo = !!headerTitle && (
    <div
      className={clsx(
        "flex min-w-0 items-center break-all text-lg font-bold leading-tight",
        feedIcon && "-ml-3",
      )}
    >
      {feedIcon && <FeedIcon target={feedIcon} fallback size={20} className="mr-4" />}
      <EllipsisHorizontalTextWithTooltip className="inline-block !w-auto max-w-full">
        {headerTitle}
      </EllipsisHorizontalTextWithTooltip>
    </div>
  )
  const { mutateAsync: refreshFeed, isPending } = useRefreshFeedMutation(feedId)

  const user = useWhoami()
  const isOnline = useIsOnline()

  const feed = useFeedById(feedId)

  const titleStyleBasedView = {
    [FeedViewType.All]: "pl-7",
    [FeedViewType.Articles]: "pl-7",
    [FeedViewType.Pictures]: "pl-7",
    [FeedViewType.Videos]: "pl-7",
    [FeedViewType.SocialMedia]: "px-5",
    [FeedViewType.Audios]: "pl-6",
    [FeedViewType.Notifications]: "pl-6",
  }

  const feedColumnShow = useSubscriptionColumnShow()
  const toggleUnreadOnlyShortcut = useCommandShortcut(COMMAND_ID.timeline.unreadOnly)
  const runCmdFn = useRunCommandFn()

  const { isScrolledBeyondThreshold } = useEntryRootState()
  const isScrolledBeyondThresholdValue = useAtomValue(isScrolledBeyondThreshold)
  return (
    <div
      className={cn(
        "flex w-full flex-col pr-2.5 pt-2 @[700px]:pr-3 @[1024px]:pr-4",
        !feedColumnShow && "macos:mt-4 macos:pt-margin-macos-traffic-light-y",
        titleStyleBasedView[view],
        isPreview
          ? "h-top-header-in-preview-with-border-b px-2.5 @[700px]:px-3 @[1024px]:px-4"
          : "h-top-header-with-border-b",
        view === FeedViewType.All &&
          "border-b border-transparent data-[scrolled-beyond-threshold=true]:border-b-border",
      )}
      data-scrolled-beyond-threshold={isScrolledBeyondThresholdValue}
    >
      <div className={"flex w-full justify-between"}>
        {isPreview ? <PreviewHeaderInfoWrapper>{titleInfo}</PreviewHeaderInfoWrapper> : titleInfo}
        {!isPreview && (
          <div
            className={cn(
              "relative z-[1] flex items-center gap-2 self-baseline text-text-secondary",
              !headerTitle && "opacity-0 [&_*]:!pointer-events-none",

              "translate-x-[6px]",
            )}
            onClick={stopPropagation}
          >
            {getView(view)?.wideMode && entryId && entryId !== ROUTE_ENTRY_PENDING && (
              <>
                <EntryHeader entryId={entryId} />
                <DividerVertical className="mx-2 w-px" />
              </>
            )}

            <AppendTaildingDivider>
              {view === FeedViewType.Pictures && <SwitchToMasonryButton />}
            </AppendTaildingDivider>

            {isOnline &&
              (feed?.ownerUserId === user?.id &&
              isBizId(routerParams.feedId!) &&
              feed?.type === "feed" ? (
                <ActionButton
                  tooltip="Refresh"
                  onClick={() => {
                    refreshFeed()
                  }}
                >
                  <RotatingRefreshIcon isRefreshing={isPending} />
                </ActionButton>
              ) : (
                <ActionButton
                  tooltip={
                    hasUpdate
                      ? t("entry_list_header.new_entries_available")
                      : t("entry_list_header.refetch")
                  }
                  onClick={() => {
                    refetch()
                  }}
                >
                  <RotatingRefreshIcon
                    className={cn(hasUpdate && "text-accent")}
                    isRefreshing={isRefreshing}
                  />
                </ActionButton>
              ))}
            {!isCollection && (
              <>
                <ActionButton
                  tooltip={
                    !unreadOnly
                      ? t("entry_list_header.show_unread_only")
                      : t("entry_list_header.show_all")
                  }
                  shortcut={toggleUnreadOnlyShortcut}
                  onClick={() => runCmdFn(COMMAND_ID.timeline.unreadOnly, [!unreadOnly])()}
                >
                  {unreadOnly ? (
                    <i className="i-mgc-round-cute-fi" />
                  ) : (
                    <i className="i-mgc-round-cute-re" />
                  )}
                </ActionButton>
                <MarkAllReadButton shortcut />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const PreviewHeaderInfoWrapper: Component = ({ children }) => {
  const { t: tCommon } = useTranslation("common")
  const follow = useFollow()

  const navigate = useNavigate()
  return (
    <div className="flex w-full flex-col pt-1.5">
      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2">
        <MotionButtonBase
          onClick={(e) => {
            e.stopPropagation()
            navigate(previewBackPath() || "/")
          }}
          className="no-drag-region mr-1 inline-flex items-center gap-1 whitespace-nowrap duration-200 hover:text-accent"
        >
          <i className="i-mingcute-left-line" />
          <span className="text-sm font-medium">{tCommon("words.back")}</span>
        </MotionButtonBase>
        {children}
        <div />
      </div>

      <button
        type="button"
        className="-mx-4 mt-3.5 flex animate-gradient-x cursor-button place-items-center justify-center gap-1 bg-gradient-to-r from-accent/10 via-accent/15 to-accent/20 px-3 py-2 font-semibold text-accent transition-all duration-300 hover:bg-accent hover:text-white"
        onClick={() => {
          const { feedId, listId } = getRouteParams()
          const feed = getFeedById(feedId)
          follow({
            isList: !!listId,
            id: listId ?? feedId,
            url: feed?.type === "feed" ? feed.url : undefined,
          })
        }}
      >
        <i className="i-mgc-add-cute-fi size-4" />
        {tCommon("words.follow")}
      </button>
    </div>
  )
}
