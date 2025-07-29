import { checkIsEditableElement } from "@follow/utils"
import { useEffect } from "react"
import { tinykeys } from "tinykeys"

import type { MenuItemInput } from "~/atoms/context-menu"
import { MenuItemText } from "~/atoms/context-menu"

export const useContextMenuActionShortCutTrigger = (items: MenuItemInput[], when: boolean) => {
  useEffect(() => {
    if (!when) return

    const actionMap = items.reduce(
      (acc, item) => {
        if (item instanceof MenuItemText) {
          if (!item.shortcut) return acc
          acc[item.shortcut] = (event: KeyboardEvent) => {
            if (checkIsEditableElement(event.target as HTMLElement)) return
            event.preventDefault()
            event.stopPropagation()
            if (item.disabled) return
            if (item.hide) return
            item.click()
          }
        }
        return acc
      },

      {} as Record<string, (e: KeyboardEvent) => void>,
    )

    return tinykeys(window, actionMap)
  }, [items, when])
}
