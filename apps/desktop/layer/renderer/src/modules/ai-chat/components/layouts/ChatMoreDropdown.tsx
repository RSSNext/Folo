import type { ReactNode } from "react"
import { useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import { useChatActions, useCurrentTitle } from "~/modules/ai-chat/store/hooks"
import { downloadMarkdown, exportChatToMarkdown } from "~/modules/ai-chat/utils/export"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

export const ChatMoreDropdown = ({
  triggerElement,
  asChild = true,
  canToggleMode = true,
}: {
  triggerElement: ReactNode
  asChild?: boolean
  canToggleMode?: boolean
}) => {
  const currentTitle = useCurrentTitle()
  const panelStyle = useAIChatPanelStyle()
  const settingModalPresent = useSettingModal()

  const chatActions = useChatActions()
  const { t } = useTranslation("ai")

  const handleExport = useCallback(() => {
    const messages = chatActions.getMessages()
    if (messages.length === 0) {
      toast.error(t("export_empty_chat"))
      return
    }

    try {
      const markdown = exportChatToMarkdown(messages, currentTitle)
      const filename = `${currentTitle || "AI_Chat"}_${new Date().toISOString().slice(0, 10)}.md`
      downloadMarkdown(markdown, filename)
      toast.success(t("export_success"))
    } catch (error) {
      toast.error(t("export_error"))
      console.error("Export error:", error)
    }
  }, [chatActions, currentTitle, t])

  const handleToggleMode = useCallback(() => {
    const newStyle =
      panelStyle === AIChatPanelStyle.Fixed ? AIChatPanelStyle.Floating : AIChatPanelStyle.Fixed
    setAIChatPanelStyle(newStyle)
  }, [panelStyle])

  const handleCloseSidebar = useRef(() => {
    setAIPanelVisibility(false)
  }).current

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={asChild}>{triggerElement}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleExport}>
          <i className="i-mgc-download-2-cute-re mr-2 size-4" />
          <span>Export Chat</span>
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
