import { clsx, cn } from "@follow/utils/utils"
import type { FC } from "react"
import { memo } from "react"

import { ImageThumbnail } from "~/modules/ai-chat/components/layouts/ImageThumbnail"
import { CircularProgress } from "~/modules/ai-chat/components/ui/UploadProgress"
import { useChatBlockActions } from "~/modules/ai-chat/store/hooks"
import type { AIChatContextBlock } from "~/modules/ai-chat/store/types"
import {
  getFileCategoryFromMimeType,
  getFileIconName,
} from "~/modules/ai-chat/utils/file-validation"

import { EntryTitle, FeedTitle } from "./TitleComponents"

export const ContextBlock: FC<{ block: AIChatContextBlock }> = memo(({ block }) => {
  const blockActions = useChatBlockActions()

  const getBlockIcon = () => {
    switch (block.type) {
      case "mainEntry": {
        return "i-mgc-star-cute-fi"
      }
      case "referEntry": {
        return "i-mgc-paper-cute-fi"
      }
      case "referFeed": {
        return "i-mgc-rss-cute-fi"
      }
      case "selectedText": {
        return "i-mgc-quill-pen-cute-re"
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
      case "mainEntry":
      case "referEntry": {
        return <EntryTitle entryId={block.value} fallback={block.value} />
      }
      case "referFeed": {
        return <FeedTitle feedId={block.value} fallback={block.value} />
      }
      case "selectedText": {
        return `"${block.value}"`
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
                  previewUrl={previewUrl || dataUrl}
                  originalUrl={dataUrl}
                  alt={name}
                  filename={name}
                  className={"m-0.5 size-5 rounded-md"}
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
      case "mainEntry": {
        return "Current"
      }
      case "referEntry": {
        return "Ref"
      }
      case "referFeed": {
        return "Feed"
      }
      case "selectedText": {
        return "Text"
      }
      case "fileAttachment": {
        return "File"
      }

      default: {
        return ""
      }
    }
  }

  const canRemove = block.type !== "mainEntry"

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
            {getBlockIcon() && <i className={cn("size-3.5 flex-shrink-0", getBlockIcon())} />}
            <span className="text-text-tertiary text-xs font-medium">{getBlockLabel()}</span>
          </div>

          <span className={"text-text min-w-0 flex-1 truncate text-xs"}>{getDisplayContent()}</span>
        </div>
      </div>

      {canRemove && (
        <button
          type="button"
          onClick={() => blockActions.removeBlock(block.id)}
          className="text-text/90 cursor-button hover:text-text absolute inset-y-0 right-2 flex-shrink-0 opacity-0 transition-all ease-in group-hover:opacity-100"
        >
          <i className="i-mgc-close-cute-re size-3" />
        </button>
      )}
    </div>
  )
})
