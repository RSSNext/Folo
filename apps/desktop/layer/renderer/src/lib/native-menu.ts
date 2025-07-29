import type { MenuItemConstructorOptions } from "electron"

import { ipcServices } from "./client"

export type ElectronMenuItem = Omit<MenuItemConstructorOptions, "click" | "submenu"> & {
  click?: () => void
  submenu?: ElectronMenuItem[]
}

export const showElectronContextMenu = async (items: Array<ElectronMenuItem>) => {
  if (!window.electron) throw new Error("electron is not available")
  const dispose = window.electron.ipcRenderer.on(
    "menu-click",
    (_, { path }: { path: number[] }) => {
      const targetMenu = getMenuItemByPath(items, path)
      if (targetMenu && typeof targetMenu.click === "function") {
        targetMenu.click()
      } else {
        console.warn(`Menu item not found or click handler missing for path: ${path}`)
      }
    },
  )
  const itemsWithoutClick = removeClick(items)
  await ipcServices?.menu.showContextMenu({ items: itemsWithoutClick })
  dispose()
}

function getMenuItemByPath(
  items: Array<ElectronMenuItem>,
  path: number[],
): ElectronMenuItem | null {
  let current: ElectronMenuItem | null = null
  let currentLevel = items

  for (const index of path) {
    if (index >= currentLevel.length) {
      return null
    }
    current = currentLevel[index] || null
    if (current?.submenu && path.indexOf(index) < path.length - 1) {
      currentLevel = current.submenu
    }
  }

  return current
}

function removeClick(items: Array<ElectronMenuItem>): Array<ElectronMenuItem> {
  return items.map((item) => ({
    ...item,
    click: undefined,
    submenu: item.submenu ? removeClick(item.submenu) : undefined,
  }))
}
