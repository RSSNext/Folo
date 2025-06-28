import { ActionButton, MotionButtonBase } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/index.js"
import { RotatingRefreshIcon } from "@follow/components/ui/loading/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { FeedViewType, views } from "@follow/constants"
import { useIsOnline } from "@follow/hooks"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { cn, isBizId } from "@follow/utils/utils"
import type { FC } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { previewBackPath } from "~/atoms/preview"
import { useGeneralSettingKey } from "~/atoms/settings/general"
import { useTimelineColumnShow } from "~/atoms/sidebar"
import { useWhoami } from "~/atoms/user"
import { FEED_COLLECTION_LIST, ROUTE_ENTRY_PENDING } from "~/constants"
import { useFollow } from "~/hooks/biz/useFollow"
import { getRouteParams, useRouteParams } from "~/hooks/biz/useRouteParams"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useRunCommandFn } from "~/modules/command/hooks/use-command"
import { useCommandShortcuts } from "~/modules/command/hooks/use-command-binding"
import { EntryHeader } from "~/modules/entry-content/components/entry-header"
import { useRefreshFeedMutation } from "~/queries/feed"
import { useFeedHeaderTitle } from "~/store/feed/hooks"

import { MarkAllReadButton } from "../components/mark-all-button"
import { useIsPreviewFeed } from "../hooks/useIsPreviewFeed"
import { AppendTaildingDivider } from "./AppendTaildingDivider"
import { DailyReportButton } from "./buttons/DailyReportButton"
import { SwitchToMasonryButton } from "./buttons/SwitchToMasonryButton"
import { WideModeButton } from "./buttons/WideModeButton"

export const EntryListHeader: FC<{
  refetch: () => void
  isRefreshing: boolean
  hasUpdate: boolean
}> = ({ refetch, isRefreshing, hasUpdate }) => {
  const routerParams = useRouteParams()
  const { t } = useTranslation()

  const unreadOnly = useGeneralSettingKey("unreadOnly")

  const { feedId, entryId, view } = routerParams
  const isPreview = useIsPreviewFeed()

  const headerTitle = useFeedHeaderTitle()

  const isInCollectionList = feedId === FEED_COLLECTION_LIST

  const titleInfo = !!headerTitle && (
    <div className="flex min-w-0 items-center break-all text-lg font-bold leading-tight">
      <EllipsisHorizontalTextWithTooltip className="inline-block !w-auto max-w-full">
        {headerTitle}
      </EllipsisHorizontalTextWithTooltip>
    </div>
  )
  const { mutateAsync: refreshFeed, isPending } = useRefreshFeedMutation(feedId)

  const user = useWhoami()
  const isOnline = useIsOnline()

  const feed = useFeedById(feedId)

  const titleStyleBasedView = ["pl-6", "pl-7", "pl-7", "pl-7", "px-5", "pl-6"]
  const feedColumnShow = useTimelineColumnShow()
  const commandShortcuts = useCommandShortcuts()
  const runCmdFn = useRunCommandFn()
  return (
    <div
      className={cn(
        "mb-2 flex w-full flex-col pr-4 pt-2.5",
        !feedColumnShow && "macos:mt-4 macos:pt-margin-macos-traffic-light-y",
        titleStyleBasedView[view],
        isPreview && "px-4",
      )}
    >
      <div className={"flex w-full justify-between"}>
        {isPreview ? <PreviewHeaderInfoWrapper>{titleInfo}</PreviewHeaderInfoWrapper> : titleInfo}
        {!isPreview && (
          <div
            className={cn(
              "text-text-secondary relative z-[1] flex items-center gap-1 self-baseline",
              (isInCollectionList || !headerTitle) && "pointer-events-none opacity-0",

              "translate-x-[6px]",
            )}
            onClick={stopPropagation}
          >
            {views[view]!.wideMode && entryId && entryId !== ROUTE_ENTRY_PENDING && (
              <>
                <EntryHeader view={view} entryId={entryId} />
                <DividerVertical className="mx-2 w-px" />
              </>
            )}

            <AppendTaildingDivider>
              {!views[view]!.wideMode && <WideModeButton />}
              {view === FeedViewType.SocialMedia && <DailyReportButton />}
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
            <ActionButton
              tooltip={
                !unreadOnly
                  ? t("entry_list_header.show_unread_only")
                  : t("entry_list_header.show_all")
              }
              shortcut={commandShortcuts[COMMAND_ID.timeline.unreadOnly]}
              onClick={() => runCmdFn(COMMAND_ID.timeline.unreadOnly, [!unreadOnly])()}
            >
              {unreadOnly ? (
                <i className="i-mgc-round-cute-fi" />
              ) : (
                <i className="i-mgc-round-cute-re" />
              )}
            </ActionButton>
            <MarkAllReadButton shortcut />
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
          className="no-drag-region hover:text-accent mr-1 inline-flex items-center gap-1 whitespace-nowrap duration-200"
        >
          <i className="i-mingcute-left-line" />
          <span className="text-sm font-medium">{tCommon("words.back")}</span>
        </MotionButtonBase>
        {children}
        <div />
      </div>

      <button
        type="button"
        className="text-accent cursor-button from-accent/10 via-accent/15 to-accent/20 hover:bg-accent animate-gradient-x -mx-4 mt-3.5 flex place-items-center justify-center gap-1 bg-gradient-to-r px-3 py-2 font-semibold transition-all duration-300 hover:text-white"
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
