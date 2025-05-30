import type { MenuItemConstructorOptions } from "electron"

import { tipcClient } from "./client"

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
  await tipcClient?.showContextMenu({ items: itemsWithoutClick })
  dispose()
}

const removeClick = (item: ElectronMenuItem[]): ElectronMenuItem[] =>
  item.map(({ click, ...rest }) => {
    if (rest.submenu)
      return {
        ...rest,
        submenu: removeClick(rest.submenu),
      }
    return rest
  })

// Function to retrieve the menu item based on the provided path
const getMenuItemByPath = (items: ElectronMenuItem[], path: number[]): ElectronMenuItem | null => {
  let currentItems = items
  let currentItem: ElectronMenuItem | null = null

  for (const index of path) {
    if (!currentItems || index >= currentItems.length) return null
    currentItem = currentItems[index]!

    if (currentItem.submenu && Array.isArray(currentItem.submenu)) {
      currentItems = currentItem.submenu
    } else {
      currentItems = []
    }
  }
  return currentItem
}
