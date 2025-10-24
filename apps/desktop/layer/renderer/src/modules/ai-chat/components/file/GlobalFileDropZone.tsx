import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import type { FC, PropsWithChildren } from "react"
import { memo, useCallback, useRef, useState } from "react"

import { useFileUploadWithDefaults } from "../../hooks/useFileUpload"

interface GlobalFileDropZoneProps extends PropsWithChildren {
  className?: string
}

export const GlobalFileDropZone: FC<GlobalFileDropZoneProps> = memo(({ children, className }) => {
  const { handleFileDrop } = useFileUploadWithDefaults()
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const dragCounterRef = useRef(0)

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
              className="absolute inset-0 bg-material-thin/80 backdrop-blur-xl"
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
              className="relative flex max-w-md flex-col items-center gap-4 rounded-2xl border border-accent/20 bg-background/95 p-8 shadow-2xl shadow-accent/10"
            >
              {isProcessing ? (
                <>
                  <div className="size-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-text">Processing files...</p>
                    <p className="text-sm text-text-secondary">
                      Please wait while we process your files
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative text-accent">
                    <i className="i-mgc-file-upload-cute-re size-16" />
                    <m.div
                      className="absolute inset-0 text-accent blur-lg"
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
                    <p className="text-lg font-medium text-text">Drop files to attach</p>
                    <p className="text-sm text-text-secondary">
                      Images, PDFs, text files, and audio files are supported
                    </p>
                  </div>
                </>
              )}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
})

GlobalFileDropZone.displayName = "GlobalFileDropZone"
