import { Logo } from "@follow/components/icons/logo.jsx"
import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"

import { setAIPanelVisibility } from "~/atoms/settings/ai"
import { useFeature } from "~/hooks/biz/useFeature"
import { useFeedHeaderTitle } from "~/store/feed/hooks"

interface EntryPlaceholderLogoProps {
  onAskAI?: () => void
}

export const EntryPlaceholderLogo = ({ onAskAI }: EntryPlaceholderLogoProps) => {
  const title = useFeedHeaderTitle()
  const aiEnabled = useFeature("ai")

  const handleAskAI = () => {
    if (onAskAI) {
      onAskAI()
      return
    }

    setAIPanelVisibility(true)
  }

  return (
    <div
      data-hide-in-print
      onContextMenu={stopPropagation}
      className={
        "flex w-full min-w-0 flex-col items-center justify-center gap-2 px-12 pb-6 text-center text-lg font-medium text-text-secondary duration-500"
      }
    >
      <Logo className="size-14 opacity-40 grayscale" />
      <div className="line-clamp-3 w-[60ch] max-w-full opacity-70">{title}</div>

      {aiEnabled && (
        <MotionButtonBase
          onClick={handleAskAI}
          className={cn(
            "mt-8 flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-medium",
            "bg-gradient-to-r from-purple-500/10 to-blue-500/10",
            "border border-purple-200/30 dark:border-purple-800/30",
            "text-purple-600 dark:text-purple-400",
            "hover:from-purple-500/20 hover:to-blue-500/20",
            "hover:border-purple-300/50 dark:hover:border-purple-700/50",
            "transition-all duration-200",
            "backdrop-blur-sm",
            "sm:duration-300 sm:group-hover:translate-y-0",
          )}
        >
          <i className="i-mingcute-ai-line text-base" />
          <span>Summarize the current timeline</span>
        </MotionButtonBase>
      )}
    </div>
  )
}
