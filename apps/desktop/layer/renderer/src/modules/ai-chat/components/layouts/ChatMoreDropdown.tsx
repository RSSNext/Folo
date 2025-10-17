import type { ReactNode } from "react"
import { useCallback, useRef } from "react"

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
