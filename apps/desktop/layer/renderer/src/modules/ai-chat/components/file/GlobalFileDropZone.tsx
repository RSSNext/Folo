import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { memo, useCallback, useRef, useState } from "react"

import { useFileUploadWithDefaults } from "../../hooks/useFileUpload"
import { useAIChatStore } from "../../store/AIChatContext"
import { UploadProgress } from "../ui/UploadProgress"

interface GlobalFileDropZoneProps extends PropsWithChildren {
  className?: string
}

export const GlobalFileDropZone: FC<GlobalFileDropZoneProps> = memo(({ children, className }) => {
  const { handleFileDrop } = useFileUploadWithDefaults()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const dragCounterRef = useRef(0)

  // Get uploading files from the store
  const blocks = useAIChatStore()((s) => s.blocks)
  const uploadingFiles = blocks
    .filter(
      (block): block is Extract<typeof block, { type: "fileAttachment" }> =>
        block.type === "fileAttachment" && block.attachment.uploadStatus === "uploading",
    )
    .map((block) => block.attachment)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    dragCounterRef.current += 1

    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    dragCounterRef.current -= 1

    if (dragCounterRef.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      dragCounterRef.current = 0
      setIsDragOver(false)

      const { files } = e.dataTransfer
      if (!files || files.length === 0) return

      setIsProcessing(true)

      try {
        await handleFileDrop(files)
      } catch (error) {
        console.error("Error processing files:", error)
      } finally {
        setIsProcessing(false)
      }
    },
    [handleFileDrop],
  )

  return (
    <div
      className={cn("relative size-full", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Global Drag Overlay */}
      <AnimatePresence>
        {isDragOver && (
          <m.div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
            {/* Glass morphism backdrop */}
            <m.div
              className="bg-material-thin/80 absolute inset-0 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={Spring.presets.smooth}
            />

            {/* Content */}
            <m.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={Spring.presets.snappy}
              className="bg-background/95 border-accent/20 shadow-accent/10 relative flex max-w-md flex-col items-center gap-4 rounded-2xl border p-8 shadow-2xl"
            >
              {isProcessing ? (
                <>
                  <div className="border-accent size-12 animate-spin rounded-full border-4 border-t-transparent" />
                  <div className="text-center">
                    <p className="text-text text-lg font-medium">Processing files...</p>
                    <p className="text-text-secondary text-sm">
                      Please wait while we process your files
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-accent relative">
                    <i className="i-mgc-file-upload-cute-re size-16" />
                    <m.div
                      className="text-accent absolute inset-0 blur-lg"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    >
                      <i className="i-mgc-file-upload-cute-re size-16" />
                    </m.div>
                  </div>
                  <div className="text-center">
                    <p className="text-text text-lg font-medium">Drop files to attach</p>
                    <p className="text-text-secondary text-sm">
                      Images, PDFs, text files, and audio files are supported
                    </p>
                  </div>
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Upload Progress Overlay */}
      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <m.div className="pointer-events-none fixed bottom-4 right-4 z-40 max-w-sm">
            <m.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={Spring.presets.snappy}
              className="bg-background/95 border-border shadow-popover rounded-lg border p-4 shadow-lg backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <i className="i-mgc-file-upload-cute-re text-accent size-5" />
                <span className="text-text text-sm font-medium">
                  Uploading {uploadingFiles.length} file{uploadingFiles.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3">
                {uploadingFiles.map((file) => (
                  <div key={file.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary truncate text-xs" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-text-tertiary text-xs">
                        {file.uploadProgress ? Math.round(file.uploadProgress) : 0}%
                      </span>
                    </div>
                    <UploadProgress
                      progress={file.uploadProgress || 0}
                      size="sm"
                      variant="default"
                    />
                  </div>
                ))}
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
})

GlobalFileDropZone.displayName = "GlobalFileDropZone"
