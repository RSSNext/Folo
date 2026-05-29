import {
  useGlobalFocusableHasScope,
  useSetGlobalFocusableScope,
} from "@follow/components/common/Focusable/hooks.js"
import { useMobile } from "@follow/components/hooks/useMobile.js"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@follow/components/ui/context-menu/context-menu.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { nextFrame, preventDefault } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import { Fragment, memo, useCallback, useEffect, useReducer, useRef } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import type { FollowMenuItem } from "~/atoms/context-menu"
import {
  MenuItemSeparator,
  MenuItemText,
  MenuItemType,
  useContextMenuState,
} from "~/atoms/context-menu"
import { HotkeyScope } from "~/constants"

export const ContextMenuProvider: Component = ({ children }) => (
  <>
    {children}
    <Handler />
  </>
)

const Handler = () => {
  const ref = useRef<HTMLSpanElement>(null)
  const [contextMenuState, setContextMenuState] = useContextMenuState()
  const wasOpenRef = useRef(false)
  const [contextMenuKey, resetContextMenu] = useReducer((key) => key + 1, 0)

  useEffect(() => {
    if (!contextMenuState.open) return
    const triggerElement = ref.current
    if (!triggerElement) return
    // [ContextMenu] Add ability to control
    // https://github.com/radix-ui/primitives/issues/1307#issuecomment-1689754796
    triggerElement.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        clientX: contextMenuState.position.x,
        clientY: contextMenuState.position.y,
      }),
    )
  }, [contextMenuState])

  useEffect(() => {
    if (contextMenuState.open) {
      wasOpenRef.current = true
      return
    }

    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    resetContextMenu()
  }, [contextMenuState.open])

  const setGlobalFocusableScope = useSetGlobalFocusableScope()

  const handleOpenChange = useCallback(
    (state: boolean) => {
      setGlobalFocusableScope(HotkeyScope.Menu, state ? "append" : "remove")
      if (state) return
      if (!contextMenuState.open) return
      setContextMenuState({ open: false })
      contextMenuState.abortController.abort()
    },
    [contextMenuState, setContextMenuState, setGlobalFocusableScope],
  )

  return (
    <ContextMenu key={contextMenuKey} onOpenChange={handleOpenChange}>
      <ContextMenuTrigger className="hidden" ref={ref} />
      {contextMenuState.open && (
        <ContextMenuContent onContextMenu={preventDefault}>
          {contextMenuState.menuItems.map((item, index) => {
            const prevItem = contextMenuState.menuItems[index - 1]
            if (prevItem instanceof MenuItemSeparator && item instanceof MenuItemSeparator) {
              return null
            }

            if (!prevItem && item instanceof MenuItemSeparator) {
              return null
            }
            const nextItem = contextMenuState.menuItems[index + 1]
            if (!nextItem && item instanceof MenuItemSeparator) {
              return null
            }
            return (
              <Item key={getMenuItemKey(item, index, contextMenuState.menuItems)} item={item} />
            )
          })}
        </ContextMenuContent>
      )}
    </ContextMenu>
  )
}

const getMenuItemKey = (item: FollowMenuItem, index: number, items: FollowMenuItem[]) => {
  if (item instanceof MenuItemSeparator) {
    const previousItem = items[index - 1]
    const nextItem = items[index + 1]
    const previousLabel = previousItem instanceof MenuItemText ? previousItem.label : "start"
    const nextLabel = nextItem instanceof MenuItemText ? nextItem.label : "end"

    return `separator-${previousLabel}-${nextLabel}`
  }

  return [
    item.label,
    item.shortcut ?? "no-shortcut",
    typeof item.checked === "boolean" ? item.checked.toString() : "unchecked",
    item.disabled ? "disabled" : "enabled",
    item.submenu.length.toString(),
  ].join(":")
}

const Item = memo(({ item }: { item: FollowMenuItem }) => {
  const onClick = useCallback(() => {
    if ("click" in item) {
      // Here we need to delay one frame,
      // so it's two raf's, in order to have `point-event: none` recorded by RadixOverlay after modal is invoked in a certain scenario,
      // and the page freezes after modal is turned off.
      nextFrame(() => {
        item.click?.()
      })
    }
  }, [item])
  const itemRef = useRef<HTMLDivElement>(null)

  useHotkeys((item as any as MenuItemText).shortcut!, () => itemRef.current?.click(), {
    enabled:
      useGlobalFocusableHasScope(HotkeyScope.Menu) &&
      item instanceof MenuItemText &&
      !!item.shortcut,

    preventDefault: true,
  })

  const isMobile = useMobile()

  switch (item.type) {
    case MenuItemType.Separator: {
      return <ContextMenuSeparator />
    }
    case MenuItemType.Action: {
      const hasSubmenu = item.submenu.length > 0
      const Wrapper = hasSubmenu
        ? ContextMenuSubTrigger
        : typeof item.checked === "boolean"
          ? ContextMenuCheckboxItem
          : ContextMenuItem

      const Sub = hasSubmenu ? ContextMenuSub : Fragment

      return (
        <Sub>
          <Wrapper
            ref={itemRef}
            disabled={item.disabled || (item.click === undefined && !hasSubmenu)}
            onClick={onClick}
            className="flex items-center gap-2"
            checked={item.checked}
          >
            {!!item.icon && (
              <span className="absolute left-2 flex items-center justify-center">{item.icon}</span>
            )}
            <span className={cn(item.icon && "pl-6")}>{item.label}</span>

            {!!item.shortcut && !isMobile && (
              <div className="-mr-1 ml-auto pl-4">
                <KbdCombined joint>{item.shortcut}</KbdCombined>
              </div>
            )}
          </Wrapper>
          {hasSubmenu && (
            <ContextMenuPortal>
              <ContextMenuSubContent>
                {item.submenu.map((subItem, index) => (
                  <Item key={getMenuItemKey(subItem, index, item.submenu)} item={subItem} />
                ))}
              </ContextMenuSubContent>
            </ContextMenuPortal>
          )}
        </Sub>
      )
    }
    default: {
      return null
    }
  }
})
