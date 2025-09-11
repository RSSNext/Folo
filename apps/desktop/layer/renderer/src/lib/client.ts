import type { IpcServices } from "@follow/electron-main"
import type { IpcRenderer } from "electron"
import { createIpcProxy } from "electron-ipc-decorator/client"

export const ipcServices = createIpcProxy<IpcServices>(
  window.electron?.ipcRenderer as unknown as IpcRenderer,
)
