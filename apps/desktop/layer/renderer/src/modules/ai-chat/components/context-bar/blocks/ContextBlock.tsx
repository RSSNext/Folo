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
  content: ReactNode
}> = memo(({ icon, label, onRemove, content }) => {
  const isStringContent = typeof content === "string"

  return (
    <div
      className={cn(
        "group relative flex h-7 min-w-0 max-w-[calc(50%-0.5rem)] flex-shrink-0 items-center gap-2 overflow-hidden rounded-lg px-2.5",
        "bg-fill-tertiary border-border border",
      )}
    >
      <div
        className={clsx(
          "min-w-0",
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

      <button
        type="button"
        onClick={onRemove}
        className="text-text/90 cursor-button hover:text-text absolute inset-y-0 right-2 flex-shrink-0 opacity-0 transition-all ease-in group-hover:opacity-100"
      >
        <i className="i-mgc-close-cute-re size-3" />
      </button>
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
}> = memo(({ viewBlock, feedBlock, unreadOnlyBlock }) => {
  const { t } = useTranslation("common")
  const blockActions = useChatBlockActions()

  const viewIcon = viewBlock && getView(Number(viewBlock.value))?.icon.props.className

  const handleRemove = () => {
    viewBlock && blockActions.removeBlock(viewBlock.id)
    feedBlock && blockActions.removeBlock(feedBlock.id)
    unreadOnlyBlock && blockActions.removeBlock(unreadOnlyBlock.id)
  }

  // Determine what to display
  const displayContent = feedBlock ? (
    <span className="flex items-center gap-1">
      <FeedTitle feedId={feedBlock.value} fallback={feedBlock.value} />
      {unreadOnlyBlock && <i className="i-mgc-round-cute-fi size-3" title="Unread Only" />}
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

  return <BlockContainer icon={viewIcon} onRemove={handleRemove} content={displayContent} />
})
CombinedContextBlock.displayName = "CombinedContextBlock"

export const ContextBlock: FC<{ block: AIChatContextBlock }> = memo(({ block }) => {
  const blockActions = useChatBlockActions()

  const { icon, label, displayContent } = useContextBlockPresentation(block)

  return (
    <BlockContainer
      icon={icon}
      label={label}
      onRemove={() => blockActions.removeBlock(block.id)}
      content={displayContent}
    />
  )
})
