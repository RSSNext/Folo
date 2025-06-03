import { IN_ELECTRON } from "@follow/shared/constants"
import { getOS, transformShortcut } from "@follow/utils/utils"
import { atom } from "jotai"
import { useCallback } from "react"

import { ipcServices } from "~/lib/client"
import { createAtomHooks } from "~/lib/jotai"
import type { ElectronMenuItem } from "~/lib/native-menu"
import { showElectronContextMenu } from "~/lib/native-menu"

// Atom

type ContextMenuState =
  | { open: false }
  | {
      open: true
      position: { x: number; y: number }
      menuItems: FollowMenuItem[]
      // Just for abort callback
      // Also can be optimized by using the `atomWithListeners`
      abortController: AbortController
    }

export const [contextMenuAtom, useContextMenuState, useContextMenuValue, useSetContextMenu] =
  createAtomHooks(atom<ContextMenuState>({ open: false }))

const useShowWebContextMenu = () => {
  const setContextMenu = useSetContextMenu()

  const showWebContextMenu = useCallback(
    async (menuItems: Array<FollowMenuItem>, e: MouseEvent | React.MouseEvent) => {
      const abortController = new AbortController()
      const resolvers = Promise.withResolvers<void>()
      setContextMenu({
        open: true,
        position: { x: e.clientX, y: e.clientY },
        menuItems,
        abortController,
      })

      abortController.signal.addEventListener("abort", () => {
        resolvers.resolve()
      })
      return resolvers.promise
    },
    [setContextMenu],
  )

  return showWebContextMenu
}

// Menu

export type FollowMenuItem = MenuItemText | MenuItemSeparator

export type MenuItemInput = MenuItemText | MenuItemSeparator | NilValue

function sortShortcutsString(shortcut: string) {
  const order = ["Shift", "Ctrl", "Meta", "Alt"]
  const nextShortcut = transformShortcut(shortcut)

  const arr = nextShortcut.split("+")

  const sortedModifiers = arr
    .filter((key) => order.includes(key))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))

  const otherKeys = arr.filter((key) => !order.includes(key))

  return [...sortedModifiers, ...otherKeys].join("+")
}

function filterNullableMenuItems(items: MenuItemInput[]): FollowMenuItem[] {
  return items
    .filter((item) => item !== null && item !== undefined && item !== false && item !== "")
    .filter((item) => !item.hide)
    .map((item) => {
      if (item instanceof MenuItemSeparator) {
        return MENU_ITEM_SEPARATOR
      }

      if (item.submenu && item.submenu.length > 0) {
        return item.extend({
          submenu: filterNullableMenuItems(item.submenu),
        })
      }

      return item
    })
}

// MenuItem must have at least one of label, role or type
function transformMenuItemsForNative(nextItems: FollowMenuItem[]): ElectronMenuItem[] {
  return nextItems.map((item) => {
    if (item instanceof MenuItemSeparator) {
      return { type: "separator" }
    }
    return {
      type: typeof item.checked === "boolean" ? "checkbox" : undefined,
      label: item.label,
      click: item.click,
      enabled:
        (!item.disabled && item.click !== undefined) || (!!item.submenu && item.submenu.length > 0),
      accelerator: item.shortcut?.replace("$mod", "CmdOrCtrl"),
      checked: typeof item.checked === "boolean" ? item.checked : undefined,
      submenu:
        item.submenu.length > 0
          ? transformMenuItemsForNative(filterNullableMenuItems(item.submenu))
          : undefined,
    }
  })
}

function withDebugMenu(menuItems: Array<FollowMenuItem>, e: MouseEvent | React.MouseEvent) {
  if (import.meta.env.DEV && e) {
    menuItems.push(
      MENU_ITEM_SEPARATOR,
      new MenuItemText({
        label: "Inspect Element",
        click: () => {
          ipcServices?.debug.inspectElement({
            x: e.pageX,
            y: e.pageY,
          })
        },
      }),
    )
  }
  return menuItems
}

export enum MenuItemType {
  Separator,
  Action,
}

export const useShowContextMenu = () => {
  const showWebContextMenu = useShowWebContextMenu()

  const showContextMenu = useCallback(
    async (inputMenu: Array<MenuItemInput>, e: MouseEvent | React.MouseEvent) => {
      const menuItems = filterNullableMenuItems(inputMenu)
      // only show native menu on macOS electron, because in other platform, the native ui is not good
      if (IN_ELECTRON && getOS() === "macOS") {
        withDebugMenu(menuItems, e)
        await showElectronContextMenu(transformMenuItemsForNative(menuItems))
        return
      }
      await showWebContextMenu(menuItems, e)
    },
    [showWebContextMenu],
  )

  return showContextMenu
}

export class MenuItemSeparator {
  readonly type = MenuItemType.Separator
  constructor(public hide = false) {}
  static default = new MenuItemSeparator()
}

const noop = () => void 0
export type BaseMenuItemTextConfig = {
  label: string
  click?: () => void
  /** only work in web app */
  icon?: React.ReactNode
  shortcut?: string
  disabled?: boolean
  checked?: boolean
  supportMultipleSelection?: boolean
}

export class BaseMenuItemText {
  readonly type = MenuItemType.Action

  private __sortedShortcut: string | null = null

  constructor(private configs: BaseMenuItemTextConfig) {
    this.__sortedShortcut = this.configs.shortcut
      ? sortShortcutsString(this.configs.shortcut)
      : null
  }

  public get label() {
    return this.configs.label
  }

  public get click() {
    return this.configs.click?.bind(this.configs) || noop
  }

  public get onClick() {
    return this.click
  }
  public get icon() {
    return this.configs.icon
  }

  public get shortcut() {
    return this.__sortedShortcut
  }

  public get disabled() {
    return this.configs.disabled || false
  }

  public get checked() {
    return this.configs.checked
  }

  public get supportMultipleSelection() {
    return this.configs.supportMultipleSelection
  }
}

export type MenuItemTextConfig = Prettify<
  BaseMenuItemTextConfig & {
    hide?: boolean
    submenu?: MenuItemInput[]
  }
>

export class MenuItemText extends BaseMenuItemText {
  protected __submenu: FollowMenuItem[]
  constructor(protected config: MenuItemTextConfig) {
    super(config)

    this.__submenu = this.config.submenu ? filterNullableMenuItems(this.config.submenu) : []
  }

  public get submenu() {
    return this.__submenu
  }

  public get hide() {
    return this.config.hide || false
  }

  extend(config: Partial<MenuItemTextConfig>) {
    return new MenuItemText({
      ...this.config,
      ...config,
    })
  }
}
export const MENU_ITEM_SEPARATOR = MenuItemSeparator.default
