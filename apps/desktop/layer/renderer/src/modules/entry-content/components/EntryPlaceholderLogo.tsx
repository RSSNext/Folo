import { Button } from "@follow/components/ui/button/index.js"
import {
  DEFAULT_RECOMMEND_FEEDS_SHORTCUT_ID,
  DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
} from "@follow/shared/settings/defaults"
import { stopPropagation } from "@follow/utils/dom"
import { useCallback } from "react"
import { toast } from "sonner"

import { useSendAIShortcut } from "~/modules/ai-chat/hooks/useSendAIShortcut"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

export const EntryPlaceholderLogo = () => {
  const { sendAIShortcut } = useSendAIShortcut()
  const settingModalPresent = useSettingModal()
  const handleSummarizeTimeline = useCallback(() => {
    void sendAIShortcut({
      shortcutId: DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
      ensureNewChat: true,
    })
  }, [sendAIShortcut])
  const handleRecommendFeeds = useCallback(() => {
    void sendAIShortcut({
      shortcutId: DEFAULT_RECOMMEND_FEEDS_SHORTCUT_ID,
      ensureNewChat: true,
    })
  }, [sendAIShortcut])

  const buttons = [
    {
      label: "Personalize my Folo AI",
      onClick: () => settingModalPresent("ai"),
    },
    {
      label: "Summarize the current timeline",
      onClick: handleSummarizeTimeline,
    },
    {
      label: "Suggest me some new feeds",
      onClick: handleRecommendFeeds,
    },
    {
      label: "Sort the timeline by importance",
      onClick: () => {
        toast.success("Coming soon!")
      },
    },
  ]

  return (
    <div
      data-hide-in-print
      onContextMenu={stopPropagation}
      className={
        "flex w-full min-w-0 flex-col items-center justify-center gap-2 px-12 pb-6 text-center text-lg font-medium text-text-secondary duration-500"
      }
    >
      <i className="i-mgc-folo-bot-original size-16 text-text-tertiary" />
      <div>Where are we off to first?</div>
      <div className="mt-4 flex flex-col gap-2">
        {buttons.map((button) => (
          <Button
            key={button.label}
            type="button"
            onClick={button.onClick}
            buttonClassName="justify-start"
            textClassName="flex items-center gap-2 text-purple-600 dark:text-purple-400"
            variant="ghost"
          >
            <i className="i-mingcute-ai-line text-base" />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-blue-400">
              {button.label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
}
