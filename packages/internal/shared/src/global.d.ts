import type { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron?: ElectronAPI
    api?: { canWindowBlur: boolean }
  }

  export const ELECTRON: boolean
}

export {}
