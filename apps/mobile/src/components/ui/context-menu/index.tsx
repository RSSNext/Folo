import { composeEventHandlers } from "@follow/utils"
import { Vibration } from "react-native"
import * as ZeegoContextMenu from "zeego/context-menu"

import { isAndroid } from "@/src/lib/platform"

export * as DropdownMenu from "zeego/dropdown-menu"

const handleContextMenuOpenWithVibration = (open: boolean) => {
  if (!isAndroid) return
  if (open) {
    Vibration.vibrate(10)
  }
}

const ContextMenuRoot: typeof ZeegoContextMenu.Root = (props) => {
  return (
    <ZeegoContextMenu.Root
      {...props}
      onOpenChange={composeEventHandlers(props.onOpenChange, handleContextMenuOpenWithVibration)}
    >
      {/* Add your context menu items here */}
    </ZeegoContextMenu.Root>
  )
}

const ContextMenu = {
  ...ZeegoContextMenu,
  Root: ContextMenuRoot,
}

export { ContextMenu }
