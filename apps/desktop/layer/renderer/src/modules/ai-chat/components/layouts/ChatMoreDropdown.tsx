import type { ReactNode } from "react"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAIPanelVisibility } from "~/atoms/settings/ai"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { toastFetchError } from "~/lib/error-parser"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { useChatActions, useCurrentChatId, useHasMessages } from "../../store/hooks"
import { generateAndUpdateChatTitle } from "../../utils/titleGeneration"

export const ChatMoreDropdown = ({
  triggerElement,
  asChild = true,
  canClosePanel = true,
}: {
  triggerElement: ReactNode
  asChild?: boolean
  canClosePanel?: boolean
}) => {
  const settingModalPresent = useSettingModal()
  const chatActions = useChatActions()
  const currentChatId = useCurrentChatId()

  const hasMessages = useHasMessages()
  const [isGenerating, setIsGenerating] = useState(false)
  const { t } = useTranslation("ai")

  const handleCloseSidebar = useRef(() => {
    setAIPanelVisibility(false)
  }).current

  const handleGenerateTitle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      const messages = chatActions.getMessages()
      if (!currentChatId || messages.length === 0 || isGenerating) {
        return
      }

      setIsGenerating(true)
      try {
        const title = await generateAndUpdateChatTitle(
          currentChatId,
          messages.slice(-2),
          (newTitle) => {
            chatActions.setCurrentTitle(newTitle)
          },
        )
        // The menu has closed by now, so a failure would otherwise go unnoticed
        if (!title) {
          toast.error(t("common.generate_title_failed"))
        }
      } catch (error) {
        console.error("Failed to generate title:", error)
        toastFetchError(error as Error, { title: t("common.generate_title_failed") })
      } finally {
        setIsGenerating(false)
      }
    },
    [currentChatId, chatActions, isGenerating, t],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={asChild}>{triggerElement}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={handleGenerateTitle}
          disabled={!currentChatId || !hasMessages || isGenerating}
        >
          <i className="i-mgc-magic-2-cute-re mr-2 size-4" />
          <span>{isGenerating ? t("common.generating_title") : t("common.generate_title")}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => settingModalPresent("ai")}>
          <i className="i-mgc-settings-1-cute-re mr-2 size-4" />
          <span>{t("settings.title")}</span>
        </DropdownMenuItem>

        {canClosePanel && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCloseSidebar}>
              <i className="i-mgc-close-cute-re mr-2 size-4" />
              <span>{t("chat.header.close_sidebar")}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
