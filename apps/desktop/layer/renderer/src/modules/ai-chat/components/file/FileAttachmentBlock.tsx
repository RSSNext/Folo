import { Button } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils"
import { motion } from "motion/react"
import { memo } from "react"

import type { FileAttachment } from "../../store/types"
import {
  formatFileSize,
  getFileCategoryFromMimeType,
  getFileIconName,
} from "../../utils/file-validation"

interface FileAttachmentBlockProps {
  fileAttachment: FileAttachment
  onRemove?: (fileId: string) => void
  showRemoveButton?: boolean
  className?: string
}

export const FileAttachmentBlock = memo(
  ({ fileAttachment, onRemove, showRemoveButton = true, className }: FileAttachmentBlockProps) => {
    const { id, name, type, size, previewUrl, uploadStatus, errorMessage } = fileAttachment

    const fileCategory = getFileCategoryFromMimeType(type)
    const iconName = getFileIconName(fileCategory)

    const isProcessing = uploadStatus === "processing"
    const hasError = uploadStatus === "error"
    const isImage = type.startsWith("image/")

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn(
          "relative flex items-center gap-3 rounded-xl border p-3 transition-colors",
          hasError
            ? "border-red bg-red/5 text-text-secondary"
            : "border-border bg-fill-secondary hover:bg-fill-tertiary",
          isProcessing && "opacity-60",
          className,
        )}
      >
        {/* File Preview/Icon */}
        <div className="flex-shrink-0">
          {isImage && previewUrl ? (
            <div className="border-border relative size-12 overflow-hidden rounded-lg border">
              <img src={previewUrl} alt={name} className="size-full object-cover" />
              {isProcessing && (
                <div className="bg-background/50 absolute inset-0 flex items-center justify-center">
                  <div className="border-accent size-4 animate-spin rounded-full border-2 border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-lg",
                hasError ? "bg-red/10" : "bg-fill-tertiary",
              )}
            >
              <div
                className={cn("size-6", iconName, hasError ? "text-red" : "text-text-secondary")}
              />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn("truncate text-sm font-medium", hasError ? "text-red" : "text-text")}
            >
              {name}
            </span>
            {isProcessing && (
              <div className="border-accent size-3 animate-spin rounded-full border border-t-transparent" />
            )}
          </div>

          <div className="text-text-tertiary flex items-center gap-2 text-xs">
            <span>{formatFileSize(size)}</span>
            {hasError && errorMessage && (
              <>
                <span>•</span>
                <span className="text-red">{errorMessage}</span>
              </>
            )}
          </div>
        </div>

        {/* Remove Button */}
        {showRemoveButton && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(id)}
            disabled={isProcessing}
            style={{
              width: "32px",
              height: "32px",
              padding: 0,
              color: "var(--text-tertiary)",
              backgroundColor: "transparent",
            }}
          >
            <div className="i-mgc-close-cute-re size-4" />
          </Button>
        )}
      </motion.div>
    )
  },
)
