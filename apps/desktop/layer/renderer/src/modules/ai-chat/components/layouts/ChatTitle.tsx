import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils/utils"
import type { ButtonHTMLAttributes } from "react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useChatActions, useCurrentChatId, useMessages } from "~/modules/ai-chat/store/hooks"
import { generateAndUpdateChatTitle } from "~/modules/ai-chat/utils/titleGeneration"

interface AIHeaderTitleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  title?: string
  placeholder?: string
  onTitleSave?: (newTitle: string) => Promise<void>
}

export const AIHeaderTitle = ({
  ref,
  title = "",
  placeholder = "Untitled Chat",
  className,
  onTitleSave,
  ...buttonProps
}: AIHeaderTitleProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const chatActions = useChatActions()
  const currentChatId = useCurrentChatId()
  const messages = useMessages()
  const [isGenerating, setIsGenerating] = useState(false)
  const { t } = useTranslation("ai")

  const displayTitle = title || placeholder
  const { ["aria-label"]: ariaLabelProp, ...restButtonProps } = buttonProps
  const ariaLabel = ariaLabelProp ?? displayTitle

  const handleGenerateTitle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!currentChatId || messages.length === 0 || isGenerating) {
        return
      }

      setIsGenerating(true)
      try {
        await generateAndUpdateChatTitle(currentChatId, messages, (newTitle) => {
          chatActions.setCurrentTitle(newTitle)
        })
      } catch (error) {
        console.error("Failed to generate title:", error)
      } finally {
        setIsGenerating(false)
      }
    },
    [currentChatId, messages, chatActions, isGenerating],
  )

  return (
    <div className="group relative flex min-w-0 flex-1 items-center gap-2">
      <button
        {...restButtonProps}
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={cn(
          "group/button flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md bg-transparent p-0 text-left",
          "focus-visible:ring-border focus-visible:ring-offset-background outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2",
          className,
        )}
      >
        <h1 className="text-text truncate font-bold">
          <span className="animate-mask-left-to-right [--animation-duration:1s]">
            {displayTitle}
          </span>
        </h1>
        <i className="i-mingcute-down-line text-text-secondary group-data-[state=open]:text-text group-hover/button:text-text size-4 transition-all duration-200 group-data-[state=open]:rotate-180" />
      </button>
      {messages.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleGenerateTitle}
              disabled={isGenerating}
              className={cn(
                "text-text-secondary hover:text-text flex size-6 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100",
                "hover:bg-fill disabled:cursor-not-allowed disabled:opacity-30",
              )}
              aria-label={isGenerating ? t("common.generating_title") : t("common.generate_title")}
            >
              {isGenerating ? (
                <i className="i-mgc-loading-3-cute-re size-4 animate-spin" />
              ) : (
                <i className="i-mgc-magic-2-cute-re size-4" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {isGenerating ? t("common.generating_title") : t("common.generate_title")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
