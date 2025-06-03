import type { IpcServices, services } from "@follow/electron-main"

// Create a proxy that makes IPC calls type-safe
function createIpcClient<T extends Record<string, Record<string, any>>>(): T {
  if (!window.electron) {
    // Web fallback - return empty objects with placeholder functions
    return new Proxy({} as T, {
      get(target, groupName: string) {
        return new Proxy(
          {},
          {
            get(_, methodName: string) {
              return (..._args: any[]) => {
                console.warn(
                  `IPC call ${groupName}.${methodName} is not available in web environment`,
                )
                return Promise.resolve()
              }
            },
          },
        )
      },
    })
  }

  return new Proxy({} as T, {
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

export const ipcClient = createIpcClient<IpcServices>()

// Export individual services for convenience
export const { app, auth, debug, dock, menu, reader, setting } = ipcClient
