import { useTypeScriptHappyCallback } from "@follow/hooks"
import { composeEventHandlers } from "@follow/utils"
import { useState } from "react"
import { Dimensions, Vibration } from "react-native"
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

const MAGIC = "none"
export const usePreventContextMenuOnEdge = (): Parameters<typeof ZeegoContextMenu.Trigger>[0] => {
  const [disableContextMenu, setDisableContextMenu] = useState(false)
  const contextMenuHandlerProps = {
    // @ts-expect-error -- See https://zeego.dev/components/context-menu#trigger
    action: disableContextMenu ? MAGIC : undefined,
    onTouchStart: useTypeScriptHappyCallback((e) => {
      if (disableContextMenu) {
        console.error("Context menu is disabled while touching the screen")
      }
      if (e.nativeEvent.touches.length !== 1) return
      const touch = e.nativeEvent.touches[0]
      if (!touch) return
      const windowWidth = Dimensions.get("window").width
      const threshold = windowWidth * 0.97
      if (touch.pageX > threshold) {
        // Disable context menu if touch is on the right side of the screen
        setDisableContextMenu(true)
        return
      }
    }, []),
    onTouchEnd: useTypeScriptHappyCallback(() => {
      setDisableContextMenu(false)
    }, []),
    asChild: true,
  } satisfies Parameters<typeof ZeegoContextMenu.Trigger>[0]

  if (!isAndroid) {
    // On iOS, we don't need to prevent context menu on edge
    return {}
  }
  return contextMenuHandlerProps
}

export { ContextMenu }
