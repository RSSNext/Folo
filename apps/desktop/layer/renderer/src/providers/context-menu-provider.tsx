import { useGlobalFocusableHasScope } from "@follow/components/common/Focusable/hooks.js"
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
import { Fragment, memo, useCallback, useEffect, useRef } from "react"
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

  useEffect(() => {
    if (!contextMenuState.open) return
    const triggerElement = ref.current
    if (!triggerElement) return
    // [ContextMenu] Add ability to control
    // https://github.com/radix-ui/primitives/issues/1307#issuecomment-1689754796
    triggerElement.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: contextMenuState.position.x,
        clientY: contextMenuState.position.y,
      }),
    )
  }, [contextMenuState])

  const handleOpenChange = useCallback(
    (state: boolean) => {
      if (state) return
      if (!contextMenuState.open) return
      setContextMenuState({ open: false })
      contextMenuState.abortController.abort()
    },
    [contextMenuState, setContextMenuState],
  )

  return (
    <ContextMenu onOpenChange={handleOpenChange}>
      <ContextMenuTrigger className="hidden" ref={ref} />
      <ContextMenuContent onContextMenu={preventDefault}>
        {contextMenuState.open &&
          contextMenuState.menuItems.map((item, index) => {
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
            return <Item key={index} item={item} />
          })}
      </ContextMenuContent>
    </ContextMenu>
  )
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
                  <Item key={index} item={subItem} />
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
