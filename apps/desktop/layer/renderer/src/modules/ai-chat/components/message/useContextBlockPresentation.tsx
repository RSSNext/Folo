import { getView } from "@follow/constants"
import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { ROUTE_FEED_IN_FOLDER } from "~/constants"
import type { AIChatContextBlock, FileAttachment } from "~/modules/ai-chat/store/types"

import { CircularProgress } from "../ui/UploadProgress"
import {
  getBlockIcon,
  getBlockLabel,
  getFileDisplayContent,
  isImageAttachment,
} from "./ai-block-constants"
import { EntryTitle, FeedTitle } from "./BlockTitleComponents"
import { ImageThumbnail } from "./ImageThumbnail"

export interface ContextBlockPresentation {
  icon?: string | null
  label?: string
  displayContent: ReactNode
  title?: string
  attachment?: FileAttachment
  isImageAttachment: boolean
}

export function useContextBlockPresentation(block: AIChatContextBlock): ContextBlockPresentation {
  const { t } = useTranslation("common")

  return useMemo(() => {
    const label = block.type === "mainView" ? "" : getBlockLabel(block.type)
    const isImage = isImageAttachment(block)
    const icon = block.type === "fileAttachment" && isImage ? null : getBlockIcon(block)
    const attachment = block.type === "fileAttachment" ? block.attachment : undefined

    const buildFileContent = (): ReactNode => {
      if (!attachment) {
        return <span className="text-text-tertiary">[File: Unknown]</span>
      }

      const { dataUrl, previewUrl, uploadStatus, uploadProgress, errorMessage, name } = attachment

      if (isImage && (dataUrl || previewUrl)) {
        return (
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <ImageThumbnail className="m-0.5 size-5 rounded-md" attachment={attachment} />

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
                  className="absolute inset-0 flex items-center justify-center rounded-md bg-red/80"
                  title={errorMessage}
                >
                  <i className="i-mgc-close-cute-re size-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-1">
              <span className="truncate" title={name}>
                {name}
              </span>

              {uploadStatus === "uploading" && uploadProgress !== undefined && (
                <span className="text-xs text-text-tertiary">{Math.round(uploadProgress)}%</span>
              )}

              {uploadStatus === "error" && (
                <span className="text-xs text-red" title={errorMessage}>
                  Upload failed
                </span>
              )}
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center gap-1.5">
          <span className="min-w-0 flex-1 truncate" title={name}>
            {name}
          </span>

          {uploadStatus === "uploading" && uploadProgress !== undefined && (
            <div className="flex items-center gap-1">
              <CircularProgress
                progress={uploadProgress}
                size={14}
                strokeWidth={2}
                variant="default"
              />
              <span className="text-xs text-text-tertiary">{Math.round(uploadProgress)}%</span>
            </div>
          )}

          {uploadStatus === "error" && (
            <i className="i-mgc-close-cute-re size-3 text-red" title={errorMessage} />
          )}
        </div>
      )
    }

    let displayContent: ReactNode
    let title: string | undefined

    switch (block.type) {
      case "mainView": {
        const viewName = getView(Number(block.value))?.name
        const translated = viewName ? t(viewName) : block.value
        displayContent = translated
        title = typeof translated === "string" ? translated : undefined
        break
      }
      case "mainEntry": {
        displayContent = <EntryTitle entryId={block.value} fallback={block.value} />
        break
      }
      case "mainFeed": {
        const category = block.value?.startsWith(ROUTE_FEED_IN_FOLDER)
          ? block.value.slice(ROUTE_FEED_IN_FOLDER.length)
          : undefined

        displayContent = category ? (
          <span>{category}</span>
        ) : (
          <FeedTitle feedId={block.value} fallback={block.value} />
        )
        break
      }
      case "selectedText": {
        displayContent = `"${block.value}"`
        title = block.value
        break
      }
      case "unreadOnly": {
        displayContent = "Unread Only"
        title = "Unread Only"
        break
      }
      case "fileAttachment": {
        displayContent = buildFileContent()
        title = attachment
          ? attachment.name || getFileDisplayContent(attachment)
          : "[File: Unknown]"
        break
      }
      default: {
        displayContent = ""
        break
      }
    }

    if (!title && typeof displayContent === "string") {
      title = displayContent
    }

    return {
      icon,
      label,
      displayContent,
      title,
      attachment,
      isImageAttachment: isImage,
    }
  }, [block, t])
}
