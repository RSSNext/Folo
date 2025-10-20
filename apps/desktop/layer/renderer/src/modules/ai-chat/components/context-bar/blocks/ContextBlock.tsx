import { getView } from "@follow/constants"
import { clsx, cn } from "@follow/utils/utils"
import type { FC, ReactNode } from "react"
import { memo } from "react"
import { useTranslation } from "react-i18next"

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
}> = memo(({ icon, label, onRemove, content, disabled, onDisableClick, readOnly }) => {
  const isStringContent = typeof content === "string"

  return (
    <div
      className={clsx(
        "group relative flex h-7 min-w-0 flex-shrink-0 items-center gap-2 overflow-hidden rounded-lg px-2.5",
        "bg-fill-tertiary border-border border",
        disabled && "cursor-pointer border-dashed opacity-50",
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
            {label && <span className="text-text-tertiary text-xs font-medium">{label}</span>}
          </div>

          {isStringContent ? (
            <span className="text-text min-w-0 flex-1 truncate text-xs">{content}</span>
          ) : (
            <div className="text-text min-w-0 flex-1 truncate text-xs">{content}</div>
          )}
        </div>
      </div>

      {onRemove && !disabled && !readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="text-text/90 cursor-button hover:text-text absolute inset-y-0 right-2 flex-shrink-0 opacity-0 transition-all ease-in group-hover:opacity-100"
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
      <FeedTitle feedId={feedBlock.value} fallback={feedBlock.value} className="min-w-0 truncate" />
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
