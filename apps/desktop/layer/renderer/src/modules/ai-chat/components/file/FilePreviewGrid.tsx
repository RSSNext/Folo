import { cn } from "@follow/utils"
import { AnimatePresence } from "motion/react"
import { memo } from "react"

import type { AIChatContextBlock } from "../../store/types"
import { FileAttachmentBlock } from "./FileAttachmentBlock"

interface FilePreviewGridProps {
  fileBlocks: AIChatContextBlock[]
  onRemove?: (fileId: string) => void
  showRemoveButton?: boolean
  className?: string
  maxColumns?: number
}

export const FilePreviewGrid = memo(
  ({
    fileBlocks,
    onRemove,
    showRemoveButton = true,
    className,
    maxColumns = 3,
  }: FilePreviewGridProps) => {
    const fileAttachments = fileBlocks.filter(
      (block) => block.type === "fileAttachment" && block.fileAttachment,
    )

    if (fileAttachments.length === 0) {
      return null
    }

    return (
      <div className={cn("space-y-2", className)}>
        <div
          className={cn(
            "grid gap-2",
            fileAttachments.length === 1 && "grid-cols-1",
            fileAttachments.length === 2 && "grid-cols-2",
            fileAttachments.length >= 3 &&
              `grid-cols-${Math.min(maxColumns, fileAttachments.length)}`,
          )}
        >
          <AnimatePresence>
            {fileAttachments.map(
              (block) =>
                block.fileAttachment && (
                  <FileAttachmentBlock
                    key={block.id}
                    fileAttachment={block.fileAttachment}
                    onRemove={onRemove}
                    showRemoveButton={showRemoveButton}
                    className="min-w-0" // Allow truncation in grid layout
                  />
                ),
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  },
)
