import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.js"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { useShowAISummary } from "~/atoms/ai-summary"
import { useEntryIsInReadabilitySuccess } from "~/atoms/readability"
import { useActionLanguage } from "~/atoms/settings/general"
import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"

export function AISummary({ entryId }: { entryId: string }) {
  const { t } = useTranslation()
  const summarySetting = useEntry(entryId, (state) => state.settings?.summary)
  const isInReadabilitySuccess = useEntryIsInReadabilitySuccess(entryId)
  const showAISummary = useShowAISummary(summarySetting)
  const actionLanguage = useActionLanguage()
  const summary = useAuthQuery(
    Queries.ai.summary({
      entryId,
      language: actionLanguage,
      target: isInReadabilitySuccess ? "readabilityContent" : "content",
    }),
    {
      enabled: showAISummary,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      meta: {
        persist: true,
      },
    },
  )

  if (!showAISummary || (!summary.isLoading && !summary.data)) {
    return null
  }

  return (
    <div
      className={cn(
        "group relative my-8 overflow-hidden rounded-2xl border border-neutral-200/50 p-5 backdrop-blur-xl",
        "bg-gradient-to-b from-neutral-50/80 to-white/40 dark:from-neutral-900/80 dark:to-neutral-900/40",
        "dark:border-neutral-800/50",

        summary.isLoading &&
          "before:absolute before:inset-0 before:-z-10 before:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] before:bg-gradient-to-r before:from-purple-100/0 before:via-purple-300/10 before:to-purple-100/0 dark:before:from-purple-900/0 dark:before:via-purple-600/10 dark:before:to-purple-900/0",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-br opacity-50",
          "from-purple-100/20 via-transparent to-blue-100/20",
          "dark:from-purple-900/20 dark:to-blue-900/20",

          summary.isLoading && "animate-[glow_4s_ease-in-out_infinite]",
        )}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Glowing AI icon */}
          <div className="center relative">
            <i
              className={cn(
                "i-mgc-ai-cute-re text-lg",
                summary.isLoading
                  ? "text-purple-500/70 dark:text-purple-400/70"
                  : "text-purple-600 dark:text-purple-400",
              )}
            />
            <div
              className={cn(
                "absolute inset-0 rounded-full blur-sm",
                summary.isLoading
                  ? "animate-[pulse_2s_infinite] bg-purple-400/30 dark:bg-purple-500/30"
                  : "animate-pulse bg-purple-400/20 dark:bg-purple-500/20",
              )}
            />
          </div>
          <span
            className={cn(
              "bg-gradient-to-r bg-clip-text font-medium text-transparent",
              summary.isLoading
                ? "from-purple-500/70 to-blue-500/70 dark:from-purple-400/70 dark:to-blue-400/70"
                : "from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400",
            )}
          >
            {t("entry_content.ai_summary")}
          </span>
        </div>

        {summary.data && (
          <CopyButton
            value={summary.data}
            variant="outline"
            className={cn(
              "!bg-white/10 !text-purple-600 dark:!text-purple-400",
              "hover:!bg-white/20 dark:hover:!bg-neutral-800/30",
              "!border-purple-200/30 dark:!border-purple-800/30",
              "sm:opacity-0 sm:duration-300 sm:group-hover:translate-y-0 sm:group-hover:opacity-100",
              "backdrop-blur-sm",
            )}
          />
        )}
      </div>

      <AutoResizeHeight className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {summary.isLoading ? (
          <div className="space-y-2">
            <div className="bg-material-ultra-thick h-3 w-full rounded-lg" />
            <div className="bg-material-ultra-thick h-3 w-[92%] rounded-lg" />
            <div className="bg-material-ultra-thick h-3 w-[85%] rounded-lg" />
          </div>
        ) : (
          <div className="animate-in fade-in-0 duration-500">
            <Markdown className="prose-sm prose-p:m-0 max-w-none">{String(summary.data)}</Markdown>
          </div>
        )}
      </AutoResizeHeight>
    </div>
  )
}
