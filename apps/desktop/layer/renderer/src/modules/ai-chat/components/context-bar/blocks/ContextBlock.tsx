import { getView } from "@follow/constants"
import { useSubscriptionsByFeedIds } from "@follow/store/subscription/hooks"
import type { SubscriptionModel } from "@follow/store/subscription/types"
import { getDefaultCategory } from "@follow/store/subscription/utils"
import { clsx, cn } from "@follow/utils/utils"
import type { FC, ReactNode } from "react"
import { memo, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import { useContextBlockPresentation } from "~/modules/ai-chat/components/message/useContextBlockPresentation"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"
import type { AbstractValueContextBlock, AIChatContextBlock } from "~/modules/ai-chat/store/types"

import { FeedTitle } from "./TitleComponents"

const BlockContainer: FC<{
  icon: string | null | undefined
  label?: string
  onRemove?: () => void
  disabled?: boolean
  onDisableClick?: () => void
  content: ReactNode
  readOnly?: boolean
  className?: string
}> = memo(({ icon, label, onRemove, content, disabled, onDisableClick, readOnly, className }) => {
  const isStringContent = typeof content === "string"

  return (
    <div
      className={clsx(
        "group relative flex h-7 min-w-0 items-center gap-2 overflow-hidden rounded-lg px-2",
        "border border-border bg-fill-quaternary",
        disabled && "cursor-pointer border-dashed italic opacity-50",
        className,
      )}
      onClick={() => {
        if (disabled) {
          onDisableClick?.()
        }
      }}
    >
      <div
        className={clsx(
          "min-w-0",
          !readOnly &&
            !disabled &&
            "group-hover:[mask-image:linear-gradient(to_right,black_0%,black_calc(100%-3rem),rgba(0,0,0,0.8)_calc(100%-2rem),rgba(0,0,0,0.3)_calc(100%-1rem),transparent_100%)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div className="flex items-center gap-1">
            {icon && <i className={cn("size-3.5 flex-shrink-0", icon)} />}
            {label && <span className="text-xs font-medium text-text-tertiary">{label}</span>}
          </div>

          {isStringContent ? (
            <span className="min-w-0 flex-1 truncate text-xs text-text">{content}</span>
          ) : (
            <div className="min-w-0 flex-1 truncate text-xs text-text">{content}</div>
          )}
        </div>
      </div>

      {onRemove && !disabled && !readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute inset-y-0 right-1 flex-shrink-0 cursor-button text-text/90 opacity-0 transition-all ease-in hover:text-text group-hover:opacity-100"
        >
          <i className="i-mgc-close-cute-re size-3" />
        </button>
      )}
    </div>
  )
})
BlockContainer.displayName = "ContextBlockContainer"

type MainViewBlock = AbstractValueContextBlock<"mainView">
type MainFeedBlock = AbstractValueContextBlock<"mainFeed">
type UnreadOnlyBlock = AbstractValueContextBlock<"unreadOnly">

export const CombinedContextBlock: FC<{
  viewBlock?: MainViewBlock
  feedBlock?: MainFeedBlock
  unreadOnlyBlock?: UnreadOnlyBlock
  readOnly?: boolean
}> = memo(({ viewBlock, feedBlock, unreadOnlyBlock, readOnly = false }) => {
  const { t } = useTranslation("common")
  const blockActions = useChatBlockActions()

  const viewIcon = viewBlock && getView(Number(viewBlock.value))?.icon.props.className
  const feedIcon = feedBlock && "i-mgc-rss-cute-fi"

  const normalizedFeedIds = useMemo(() => {
    if (!feedBlock?.value) {
      return []
    }

    return feedBlock.value
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id && !id.startsWith(ROUTE_FEED_IN_FOLDER))
  }, [feedBlock?.value])

  const feedSubscriptions = useSubscriptionsByFeedIds(normalizedFeedIds)

  const sharedFeedCategory = useMemo(() => {
    if (normalizedFeedIds.length <= 1) {
      return null
    }

    const relevantSubscriptions = feedSubscriptions.filter(
      (subscription): subscription is SubscriptionModel =>
        !!subscription && subscription.type === "feed" && !!subscription.feedId,
    )

    if (relevantSubscriptions.length !== normalizedFeedIds.length) {
      return null
    }

    const categories = relevantSubscriptions.map((subscription) => {
      const category = subscription.category || getDefaultCategory(subscription)
      return category?.trim() || null
    })

    const firstCategory = categories[0]
    if (!firstCategory) {
      return null
    }

    return categories.every((category) => category === firstCategory) ? firstCategory : null
  }, [feedSubscriptions, normalizedFeedIds])

  const handleRemove = () => {
    viewBlock && blockActions.toggleBlockDisabled(viewBlock.id, true)
    feedBlock && blockActions.toggleBlockDisabled(feedBlock.id, true)
    unreadOnlyBlock && blockActions.removeBlock(unreadOnlyBlock.id)
  }

  const handleEnable = () => {
    viewBlock && blockActions.toggleBlockDisabled(viewBlock.id, false)
    feedBlock && blockActions.toggleBlockDisabled(feedBlock.id, false)
  }

  // Determine what to display
  const displayContent = feedBlock ? (
    <span className="flex items-center gap-1">
      {sharedFeedCategory ? (
        <span className="min-w-0 truncate" title={sharedFeedCategory}>
          {sharedFeedCategory}
        </span>
      ) : (
        <FeedTitle
          feedId={feedBlock.value}
          fallback={feedBlock.value}
          className="min-w-0 truncate"
        />
      )}
      {unreadOnlyBlock && <i className="i-mgc-round-cute-fi size-3 shrink-0" title="Unread Only" />}
    </span>
  ) : (
    <span className="flex items-center gap-1">
      {(() => {
        if (!viewBlock) return null
        const viewName = getView(Number(viewBlock.value))?.name
        return viewName ? t(viewName) : viewBlock.value
      })()}
      {unreadOnlyBlock && <i className="i-mgc-round-cute-fi size-3" title="Unread Only" />}
    </span>
  )

  return (
    <BlockContainer
      icon={viewIcon || feedIcon}
      disabled={viewBlock?.disabled || feedBlock?.disabled || unreadOnlyBlock?.disabled}
      onRemove={!readOnly ? handleRemove : undefined}
      onDisableClick={!readOnly ? handleEnable : undefined}
      content={displayContent}
      readOnly={readOnly}
    />
  )
})
CombinedContextBlock.displayName = "CombinedContextBlock"

export const ContextBlock: FC<{ block: AIChatContextBlock; readOnly?: boolean }> = memo(
  ({ block, readOnly }) => {
    const blockActions = useChatBlockActions()

    const { icon, label, displayContent } = useContextBlockPresentation(block)

    return (
      <BlockContainer
        icon={icon}
        label={label}
        disabled={block.disabled}
        onRemove={() => {
          if (block.type === "mainEntry") {
            blockActions.toggleBlockDisabled(block.id, true)
          } else {
            blockActions.removeBlock(block.id)
          }
        }}
        onDisableClick={() => {
          if (block.type === "mainEntry") {
            blockActions.toggleBlockDisabled(block.id, false)
          }
        }}
        content={displayContent}
        readOnly={readOnly}
      />
    )
  },
)
