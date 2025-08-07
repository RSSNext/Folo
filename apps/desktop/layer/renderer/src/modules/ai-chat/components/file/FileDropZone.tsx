import { DropZone } from "@follow/components/ui/drop-zone/index.js"
import { cn } from "@follow/utils"
import { AnimatePresence, motion } from "motion/react"
import { memo, useCallback, useState } from "react"

import { useBlockActions } from "../../store/hooks"
import { processFileList } from "../../utils/file-processing"
import { FileAttachmentBlock } from "./FileAttachmentBlock"

interface FileDropZoneProps {
  className?: string
  compact?: boolean
}

export const FileDropZone = memo(({ className, compact = false }: FileDropZoneProps) => {
  const blockActions = useBlockActions()
  const [isProcessing, setIsProcessing] = useState(false)

  const fileAttachments = blockActions.getFileAttachments()
  const hasFiles = fileAttachments.length > 0

  const handleFileDrop = useCallback(
    async (files: FileList) => {
      setIsProcessing(true)

      try {
        const results = await processFileList(files)

        results.forEach((result) => {
          if (result.success && result.fileAttachment) {
            blockActions.addFileAttachment(result.fileAttachment)
          } else {
            // Show error toast or handle error
            console.error("File processing error:", result.error)
          }
        })
      } catch (error) {
        console.error("Error processing files:", error)
      } finally {
        setIsProcessing(false)
      }
    },
    [blockActions],
  )

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      blockActions.removeFileAttachment(fileId)
    },
    [blockActions],
  )

  if (compact && hasFiles) {
    return (
      <div className={cn("space-y-2", className)}>
        <AnimatePresence>
          {fileAttachments.map(
            (block) =>
              block.fileAttachment && (
                <FileAttachmentBlock
                  key={block.id}
                  fileAttachment={block.fileAttachment}
                  onRemove={handleRemoveFile}
                />
              ),
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* File Attachments List */}
      {hasFiles && (
        <div className="space-y-2">
          <AnimatePresence>
            {fileAttachments.map(
              (block) =>
                block.fileAttachment && (
                  <FileAttachmentBlock
                    key={block.id}
                    fileAttachment={block.fileAttachment}
                    onRemove={handleRemoveFile}
                  />
                ),
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Drop Zone */}
      <DropZone
        onDrop={handleFileDrop}
        className={cn(
          hasFiles && "border-border/50 hover:border-border border-dashed",
          isProcessing && "pointer-events-none opacity-50",
        )}
      >
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: isProcessing ? 0.5 : 0.7 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          {isProcessing ? (
            <>
              <div className="border-accent size-6 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-text-tertiary text-sm">Processing files...</span>
            </>
          ) : (
            <>
              <div className="i-mgc-attachment-cute-re text-text-tertiary size-6" />
              <div className="text-text-tertiary text-sm">
                <span className="font-medium">Click to upload</span> or drag and drop
                <br />
                <span className="text-xs">Images, PDFs, text files, and audio files</span>
              </div>
            </>
          )}
        </motion.div>
      </DropZone>
    </div>
  )
})
