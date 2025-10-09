import { views } from "@follow/constants"
import { clsx, cn } from "@follow/utils/utils"
import type { FC, ReactNode } from "react"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { ImageThumbnail } from "~/modules/ai-chat/components/message/ImageThumbnail"
import { CircularProgress } from "~/modules/ai-chat/components/ui/UploadProgress"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock, ValueContextBlock } from "~/modules/ai-chat/store/types"
import {
  getFileCategoryFromMimeType,
  getFileIconName,
} from "~/modules/ai-chat/utils/file-validation"

import { EntryTitle, FeedTitle } from "./TitleComponents"

const blockTypeCanNotBeRemoved = new Set<string>([])

const BlockContainer: FC<{
  icon: string | null | undefined
  label?: string
  canRemove: boolean
  onRemove?: () => void
  content: ReactNode
}> = memo(({ icon, label, canRemove, onRemove, content }) => {
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
          canRemove
            ? "group-hover:[mask-image:linear-gradient(to_right,black_0%,black_calc(100%-3rem),rgba(0,0,0,0.8)_calc(100%-2rem),rgba(0,0,0,0.3)_calc(100%-1rem),transparent_100%)]"
            : void 0,
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

      {canRemove && (
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

type ValueBlockOf<Type extends ValueContextBlock["type"]> = Omit<ValueContextBlock, "type"> & {
  type: Type
}

type MainViewBlock = ValueBlockOf<"mainView">
type MainFeedBlock = ValueBlockOf<"mainFeed">
type UnreadOnlyBlock = ValueBlockOf<"unreadOnly">

export const CombinedContextBlock: FC<{
  viewBlock: MainViewBlock
  feedBlock?: MainFeedBlock
  unreadOnlyBlock?: UnreadOnlyBlock
}> = memo(({ viewBlock, feedBlock, unreadOnlyBlock }) => {
  const { t } = useTranslation("common")
  const blockActions = useChatBlockActions()

  const viewIcon = views.find((v) => v.view === Number(viewBlock.value))?.icon.props.className

  const canRemove =
    !blockTypeCanNotBeRemoved.has(viewBlock.type) &&
    (!feedBlock || !blockTypeCanNotBeRemoved.has(feedBlock.type))

  const handleRemove = () => {
    blockActions.removeBlock(viewBlock.id)
    if (feedBlock) {
      blockActions.removeBlock(feedBlock.id)
    }
    if (unreadOnlyBlock) {
      blockActions.removeBlock(unreadOnlyBlock.id)
    }
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
        const viewName = views.find((v) => v.view === Number(viewBlock.value))?.name
        return viewName ? t(viewName) : viewBlock.value
      })()}
      {unreadOnlyBlock && <i className="i-mgc-round-cute-fi size-3" title="Unread Only" />}
    </span>
  )

  return (
    <BlockContainer
      icon={viewIcon}
      canRemove={canRemove}
      onRemove={handleRemove}
      content={displayContent}
    />
  )
})
CombinedContextBlock.displayName = "CombinedContextBlock"

export const ContextBlock: FC<{ block: AIChatContextBlock }> = memo(({ block }) => {
  const { t } = useTranslation("common")
  const blockActions = useChatBlockActions()

  const getBlockIcon = () => {
    switch (block.type) {
      case "mainView": {
        const viewIcon = views.find((v) => v.view === Number(block.value))?.icon.props.className
        return viewIcon
      }
      case "mainEntry": {
        return "i-mgc-star-cute-fi"
      }
      case "referEntry": {
        return "i-mgc-paper-cute-fi"
      }
      case "mainFeed": {
        return "i-mgc-rss-cute-fi"
      }
      case "selectedText": {
        return "i-mgc-quill-pen-cute-re"
      }
      case "unreadOnly": {
        return "i-mgc-round-cute-fi"
      }
      case "fileAttachment": {
        const { type, dataUrl, previewUrl } = block.attachment
        const fileCategory = getFileCategoryFromMimeType(type)

        // Don't show icon for images with thumbnails, as the thumbnail serves as the icon
        if (fileCategory === "image" && (dataUrl || previewUrl)) {
          return null
        }

        return getFileIconName(fileCategory)
      }

      default: {
        return "i-mgc-paper-cute-fi"
      }
    }
  }

  const getDisplayContent = () => {
    switch (block.type) {
      case "mainView": {
        const viewName = views.find((v) => v.view === Number(block.value))?.name
        return viewName ? t(viewName) : block.value
      }
      case "mainEntry":
      case "referEntry": {
        return <EntryTitle entryId={block.value} fallback={block.value} />
      }
      case "mainFeed": {
        return <FeedTitle feedId={block.value} fallback={block.value} />
      }
      case "selectedText": {
        return `"${block.value}"`
      }
      case "unreadOnly": {
        return "Unread Only"
      }
      case "fileAttachment": {
        const { type, name, dataUrl, previewUrl, uploadStatus, errorMessage, uploadProgress } =
          block.attachment

        const fileCategory = getFileCategoryFromMimeType(type)

        if (fileCategory === "image" && (dataUrl || previewUrl)) {
          return (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <ImageThumbnail
                  className={"m-0.5 size-5 rounded-md"}
                  attachment={block.attachment}
                />
                {uploadStatus === "uploading" && uploadProgress !== undefined && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                    <CircularProgress
                      progress={uploadProgress}
                      size={16}
                      strokeWidth={2}
                      variant="default"
                      className="text-white"
                    />
                  </div>
                )}
                {uploadStatus === "error" && (
                  <div
                    className="bg-red/80 absolute inset-0 flex items-center justify-center rounded-md"
                    title={errorMessage}
                  >
                    <i className="i-mgc-close-cute-re size-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1">
                <span className="truncate">
                  {name}{" "}
                  {uploadStatus === "uploading" && uploadProgress !== undefined && (
                    <div className="text-text-tertiary text-xs">
                      ({Math.round(uploadProgress)}%)
                    </div>
                  )}
                </span>

                {uploadStatus === "error" && <div className="text-red text-xs">Upload failed</div>}
              </div>
            </div>
          )
        }

        // For non-image files
        return (
          <div className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate">{name}</span>
            {uploadStatus === "uploading" && uploadProgress !== undefined && (
              <div className="flex items-center gap-1">
                <CircularProgress
                  progress={uploadProgress}
                  size={14}
                  strokeWidth={2}
                  variant="default"
                />
                <span className="text-text-tertiary text-xs">{Math.round(uploadProgress)}%</span>
              </div>
            )}
            {uploadStatus === "error" && (
              <i className="i-mgc-close-cute-re text-red size-3" title={errorMessage} />
            )}
          </div>
        )
      }
      default: {
        // This should never happen with proper discriminated union
        return ""
      }
    }
  }

  const getBlockLabel = () => {
    switch (block.type) {
      case "mainView": {
        return ""
      }
      case "mainEntry": {
        return "Current"
      }
      case "mainFeed": {
        return "Current"
      }
      case "referEntry": {
        return "Ref"
      }
      case "selectedText": {
        return "Text"
      }
      case "unreadOnly": {
        return "Filter"
      }
      case "fileAttachment": {
        return "File"
      }

      default: {
        return ""
      }
    }
  }

  const canRemove = !blockTypeCanNotBeRemoved.has(block.type)

  return (
    <BlockContainer
      icon={getBlockIcon()}
      label={getBlockLabel()}
      canRemove={canRemove}
      onRemove={canRemove ? () => blockActions.removeBlock(block.id) : undefined}
      content={getDisplayContent()}
    />
  )
})
