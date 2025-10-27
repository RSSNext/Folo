import type { ToolUIPart } from "ai"
import clsx from "clsx"
import * as React from "react"
import { useTranslation } from "react-i18next"

interface SaveMemoryCardProps {
  part: ToolUIPart
  variant?: "loose" | "tight"
}

export const SaveMemoryCard: React.FC<SaveMemoryCardProps> = React.memo(
  ({ part, variant = "tight" }) => {
    const { t } = useTranslation("ai")
    const hasError = "errorText" in part && part.errorText
    const hasResult = "output" in part && part.output
    const isCalling = part.state === "input-streaming"

    // Extract memory content from input
    const memoryContent =
      "input" in part && part.input && typeof part.input === "object"
        ? (part.input as { memory?: string }).memory
        : null

    // Extract tags if available
    const tags =
      "input" in part && part.input && typeof part.input === "object"
        ? (part.input as { tags?: string[] }).tags
        : null

    // Don't render if no memory content
    if (!memoryContent) return null

    return (
      <div className={clsx("select-none last:pb-0", variant === "tight" ? "pb-1.5" : "pb-3")}>
        {/* Memory Card */}
        <div
          className={clsx(
            "group rounded-lg border transition-colors",
            hasError
              ? "border-red/30 bg-red/5 hover:bg-red/10"
              : "border-border bg-material-ultra-thin hover:bg-material-thin",
          )}
        >
          <div className="space-y-1.5 p-2.5">
            {/* Status Header */}
            <div className="flex items-center gap-1.5">
              <span
                className={clsx(
                  "text-[11px] font-medium",
                  hasError ? "text-red" : hasResult ? "text-green" : "text-text-secondary",
                )}
              >
                {isCalling
                  ? t("memories.toast.saving")
                  : hasError
                    ? t("memories.toast.failed")
                    : hasResult
                      ? t("memories.toast.saved")
                      : t("memories.toast.processing")}
              </span>
              {isCalling && (
                <i className="i-mgc-loading-3-cute-re size-3 animate-spin text-text-secondary" />
              )}
            </div>

            {/* Memory Content */}
            <div className="space-y-1">
              <p className="select-text text-sm leading-normal text-text">{memoryContent}</p>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-material-thin px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-text-tertiary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error Message */}
            {hasError && "errorText" in part && (
              <div className="rounded bg-red/10 p-1.5 text-[11px] leading-tight text-red">
                {String(part.errorText)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  },
)

SaveMemoryCard.displayName = "SaveMemoryCard"
