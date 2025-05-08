import { ActionButton } from "@follow/components/ui/button/index.js"
import { DividerVertical } from "@follow/components/ui/divider/index.js"
import { RotatingRefreshIcon } from "@follow/components/ui/loading/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { FeedViewType, views } from "@follow/constants"
import { useIsOnline } from "@follow/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { cn, isBizId } from "@follow/utils/utils"
import type { FC } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"

import { previewBackPath } from "~/atoms/preview"
import { setGeneralSetting, useGeneralSettingKey } from "~/atoms/settings/general"
import { useTimelineColumnShow } from "~/atoms/sidebar"
import { useWhoami } from "~/atoms/user"
import { FEED_COLLECTION_LIST, ROUTE_ENTRY_PENDING } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useFollow } from "~/hooks/biz/useFollow"
import { getRouteParams, useRouteParams } from "~/hooks/biz/useRouteParams"
import { EntryHeader } from "~/modules/entry-content/header"
import { useRefreshFeedMutation } from "~/queries/feed"
import { getFeedById, useFeedById, useFeedHeaderTitle } from "~/store/feed"

import { MarkAllReadButton } from "../components/mark-all-button"
import { useIsPreviewFeed } from "../hooks/useIsPreviewFeed"
import {
  AppendTaildingDivider,
  DailyReportButton,
  SwitchToMasonryButton,
  WideModeButton,
} from "./EntryListHeader.shared"

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

  return (
    <div
      className={cn(
        "mb-2 flex w-full flex-col pr-4 pt-2.5 transition-[padding] duration-300 ease-in-out",
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
              shortcut={shortcuts.entries.toggleUnreadOnly.key}
              onClick={() => setGeneralSetting("unreadOnly", !unreadOnly)}
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
    <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2">
      <button
        type="button"
        className="cursor-button text-text-secondary hover:text-accent inline-flex items-center gap-1 duration-200"
        onClick={(e) => {
          e.stopPropagation()
          navigate(previewBackPath() || "/")
        }}
      >
        <i className="i-mingcute-left-line size-4" />
        {tCommon("words.back")}
      </button>
      <div className="relative flex justify-center">
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      </div>
      <button
        type="button"
        className="text-accent cursor-button hover:bg-fill-quaternary -mr-2 rounded px-2 py-0.5 font-semibold"
        onClick={() => {
          const { feedId, listId } = getRouteParams()
          if (!feedId) return
          const feed = getFeedById(feedId)
          if (!feed) return
          follow({
            isList: !!listId,
            id: listId ?? feedId,
            url: feed.type === "feed" ? feed.url : undefined,
          })
        }}
      >
        {tCommon("words.follow")}
      </button>
    </div>
  )
}
