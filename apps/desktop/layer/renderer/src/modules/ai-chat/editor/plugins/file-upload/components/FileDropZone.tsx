import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { AnimatePresence, m } from "motion/react"
import { memo } from "react"

interface FileDropZoneProps {
  isVisible: boolean
  isDragOver: boolean
  className?: string
}

export const FileDropZone = memo(({ isVisible, isDragOver, className }: FileDropZoneProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          className={cn(
            "pointer-events-none absolute inset-0 z-50 flex items-center justify-center",
            className,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={Spring.presets.smooth}
        >
          {/* Backdrop */}
          <m.div
            className={cn(
              "absolute inset-0 backdrop-blur-sm transition-colors duration-200",
              isDragOver ? "bg-material-thin/90" : "bg-material-thin/60",
            )}
          />

          {/* Drop zone content */}
          <m.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            transition={Spring.presets.snappy}
            className={cn(
              "rounded-xl border-2 border-dashed bg-background/95 p-6 text-center transition-all duration-200",
              isDragOver
                ? "border-accent bg-accent/5 shadow-lg shadow-accent/20"
                : "border-border/50 shadow-sm",
            )}
          >
            <m.div
              className="mb-3 flex justify-center text-accent"
              animate={isDragOver ? { scale: [1, 1.1, 1] } : {}}
              transition={{
                duration: 0.6,
                repeat: isDragOver ? Number.POSITIVE_INFINITY : 0,
                ease: "easeInOut",
              }}
            >
              <i className="i-mgc-file-upload-cute-re size-8" />
            </m.div>

            <p className={cn("font-medium text-text", isDragOver && "text-accent")}>
              {isDragOver ? "Drop files to upload" : "Drag files here to upload"}
            </p>

            <p className="mt-1 text-sm text-text-secondary">
              Images, PDFs, and text files supported
            </p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
})

FileDropZone.displayName = "FileDropZone"
