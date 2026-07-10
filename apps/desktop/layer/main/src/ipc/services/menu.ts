import type { MenuItemConstructorOptions, MessageBoxOptions, WebContents } from "electron"
import { dialog, Menu, ShareMenu } from "electron"
import { getIpcContext, IpcMethod, IpcService } from "electron-ipc-decorator"

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
  static override readonly groupName = "menu"

  private normalizeMenuItems(
    items: SerializableMenuItem[],
    sender: WebContents,
    path: number[] = [],
  ): MenuItemConstructorOptions[] {
    return items.map((item, index) => {
      const curPath = [...path, index]
      return {
        ...item,
        click() {
          sender.send("menu-click", {
            id: item.id,
            path: curPath,
          })
        },
        submenu: item.submenu ? this.normalizeMenuItems(item.submenu, sender, curPath) : undefined,
      }
    })
  }

  @IpcMethod()
  async showContextMenu(input: ShowContextMenuInput): Promise<void> {
    const { sender } = getIpcContext()
    const defer = Promise.withResolvers<void>()
    const normalizedMenuItems = this.normalizeMenuItems(input.items, sender)

    const menu = Menu.buildFromTemplate(normalizedMenuItems)
    menu.popup({
      callback: () => defer.resolve(),
    })
    return defer.promise
  }

  @IpcMethod()
  async showConfirmDialog(input: ShowConfirmDialogInput): Promise<boolean> {
    const result = await dialog.showMessageBox({
      message: input.title,
      detail: input.message,
      buttons: ["Confirm", "Cancel"],
      ...input.options,
    })
    return result.response === 0
  }

  @IpcMethod()
  async showShareMenu(input: string): Promise<void> {
    const { sender } = getIpcContext()
    const menu = new ShareMenu({
      urls: [input],
    })

    menu.popup({
      callback: () => {
        sender.send("menu-closed")
      },
    })
  }
}
