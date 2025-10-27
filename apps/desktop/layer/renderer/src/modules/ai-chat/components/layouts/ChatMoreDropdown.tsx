import type { ReactNode } from "react"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  AIChatPanelStyle,
  setAIChatPanelStyle,
  setAIPanelVisibility,
  useAIChatPanelStyle,
} from "~/atoms/settings/ai"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { useChatActions, useCurrentChatId, useMessages } from "../../store/hooks"
import { generateAndUpdateChatTitle } from "../../utils/titleGeneration"

export const ChatMoreDropdown = ({
  triggerElement,
  asChild = true,
  canToggleMode = true,
}: {
  triggerElement: ReactNode
  asChild?: boolean
  canToggleMode?: boolean
}) => {
  const panelStyle = useAIChatPanelStyle()
  const settingModalPresent = useSettingModal()
  const chatActions = useChatActions()
  const currentChatId = useCurrentChatId()

  const messages = useMessages()
  const [isGenerating, setIsGenerating] = useState(false)
  const { t } = useTranslation("ai")

  const handleToggleMode = useCallback(() => {
    const newStyle =
      panelStyle === AIChatPanelStyle.Fixed ? AIChatPanelStyle.Floating : AIChatPanelStyle.Fixed
    setAIChatPanelStyle(newStyle)
  }, [panelStyle])

  const handleCloseSidebar = useRef(() => {
    setAIPanelVisibility(false)
  }).current

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

        <DropdownMenuSeparator />
        {canToggleMode && (
          <>
            <DropdownMenuItem onClick={handleToggleMode}>
              <i
                className={`mr-2 size-4 ${panelStyle === AIChatPanelStyle.Fixed ? "i-mingcute-rectangle-vertical-line" : "i-mingcute-layout-right-line"}`}
              />
              <span>
                {panelStyle === AIChatPanelStyle.Fixed
                  ? "Switch to Floating Panel"
                  : "Switch to Fixed Panel"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={() => settingModalPresent("ai")}>
          <i className="i-mgc-settings-1-cute-re mr-2 size-4" />
          <span>AI Settings</span>
        </DropdownMenuItem>

        {panelStyle !== AIChatPanelStyle.Floating && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCloseSidebar}>
              <i className="i-mgc-close-cute-re mr-2 size-4" />
              <span>Close Sidebar</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
