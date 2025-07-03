import type { ElectronAPI } from "@electron-toolkit/preload"

declare global {
  interface Window {
    electron?: ElectronAPI
    api?: { canWindowBlur: boolean }
    platform: NodeJS.Platform
  }
  export const APP_NAME = "Folo"
}

declare module "virtual:pwa-register/react" {
  import type { Dispatch, SetStateAction } from "react"
  import type { RegisterSWOptions } from "vite-plugin-pwa/types"

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}

export {}

export { type RegisterSWOptions } from "vite-plugin-pwa/types"
