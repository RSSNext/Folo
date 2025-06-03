import type { MenuItemConstructorOptions, MessageBoxOptions } from "electron"
import { dialog, Menu, ShareMenu } from "electron"

import type { IpcContext } from "../base"
import { IpcService } from "../base"

type SerializableMenuItem = Omit<MenuItemConstructorOptions, "click" | "submenu"> & {
  submenu?: SerializableMenuItem[]
}

interface ShowContextMenuInput {
  items: SerializableMenuItem[]
}

interface ShowConfirmDialogInput {
  title: string
  message: string
  options?: Partial<MessageBoxOptions>
}

export class MenuService extends IpcService {
  constructor() {
    super("menu")
  }

  protected registerMethods(): void {
    this.registerMethod("showContextMenu", this.showContextMenu.bind(this))
    this.registerMethod("showConfirmDialog", this.showConfirmDialog.bind(this))
    this.registerMethod("showShareMenu", this.showShareMenu.bind(this))
  }

  private normalizeMenuItems(
    items: SerializableMenuItem[],
    context: IpcContext,
    path: number[] = [],
  ): MenuItemConstructorOptions[] {
    return items.map((item, index) => {
      const curPath = [...path, index]
      return {
        ...item,
        click() {
          context.sender.send("menu-click", {
            id: item.id,
            path: curPath,
          })
        },
        submenu: item.submenu ? this.normalizeMenuItems(item.submenu, context, curPath) : undefined,
      }
    })
  }

  async showContextMenu(context: IpcContext, input: ShowContextMenuInput): Promise<void> {
    const defer = Promise.withResolvers<void>()
    const normalizedMenuItems = this.normalizeMenuItems(input.items, context)

    const menu = Menu.buildFromTemplate(normalizedMenuItems)
    menu.popup({
      callback: () => defer.resolve(),
    })
    return defer.promise
  }

  async showConfirmDialog(_context: IpcContext, input: ShowConfirmDialogInput): Promise<boolean> {
    const result = await dialog.showMessageBox({
      message: input.title,
      detail: input.message,
      buttons: ["Confirm", "Cancel"],
      ...input.options,
    })
    return result.response === 0
  }

  async showShareMenu(context: IpcContext, input: string): Promise<void> {
    const menu = new ShareMenu({
      urls: [input],
    })

    menu.popup({
      callback: () => {
        context.sender.send("menu-closed")
      },
    })
  }
}
