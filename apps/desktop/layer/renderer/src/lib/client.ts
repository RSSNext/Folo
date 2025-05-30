import { createClient } from "@egoist/tipc/renderer"
import type { Router } from "@follow/electron-main"

export const tipcClient = window.electron
  ? createClient<Router>({
      ipcInvoke: window.electron.ipcRenderer.invoke,
    })
  : null
