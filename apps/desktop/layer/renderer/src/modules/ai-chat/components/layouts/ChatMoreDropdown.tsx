import type { ReactNode } from "react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { useChatActions, useCurrentChatId, useMessages } from "../../store/hooks"
import { generateAndUpdateChatTitle } from "../../utils/titleGeneration"

export const ChatMoreDropdown = ({
  triggerElement,
  asChild = true,
}: {
  triggerElement: ReactNode
  asChild?: boolean
}) => {
  const settingModalPresent = useSettingModal()
  const chatActions = useChatActions()
  const currentChatId = useCurrentChatId()

  const messages = useMessages()
  const [isGenerating, setIsGenerating] = useState(false)
  const { t } = useTranslation("ai")

  const handleGenerateTitle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!currentChatId || messages.length === 0 || isGenerating) {
        return
      }

      setIsGenerating(true)
      try {
        await generateAndUpdateChatTitle(currentChatId, messages.slice(-2), (newTitle) => {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild={asChild}>{triggerElement}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleGenerateTitle}
          disabled={!currentChatId || messages.length === 0 || isGenerating}
        >
          <i className="i-mgc-magic-2-cute-re mr-2 size-4" />
          <span>{isGenerating ? t("common.generating_title") : t("common.generate_title")}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => settingModalPresent("ai")}>
          <i className="i-mgc-settings-1-cute-re mr-2 size-4" />
          <span>AI Settings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
