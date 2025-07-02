import type { IpcServices } from "@follow/electron-main"

function createIpcProxy(): IpcServices | null {
  if (!window.electron) {
    return null
  }

  return new Proxy({} as IpcServices, {
    get(target, groupName: string) {
      return new Proxy(
        {},
        {
          get(_, methodName: string) {
            return (...args: any[]) => {
              const channel = `${groupName}.${methodName}`
              return window.electron!.ipcRenderer.invoke(channel, args[0])
            }
          },
        },
      )
    },
  })
}

export const ipcServices = createIpcProxy()
