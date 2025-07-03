import type { ElectronAPI } from "@electron-toolkit/preload"

declare const globalThis: {
  window: Window & {
    electron?: ElectronAPI
    api?: { canWindowBlur: boolean }
  }
  electron?: ElectronAPI
}

export enum ModeEnum {
  development = "development",
  staging = "staging",
  production = "production",
}

export const MODE = import.meta.env?.MODE as ModeEnum

export const { PROD } = import.meta.env ?? {}

export const DEV =
  "process" in globalThis ? process.env.NODE_ENV === "development" : import.meta.env.DEV

export const LEGACY_APP_PROTOCOL = DEV ? "follow-dev" : "follow"
export const APP_PROTOCOL = DEV ? "folo-dev" : "folo"
export const DEEPLINK_SCHEME = `${APP_PROTOCOL}://` as const

export const SYSTEM_CAN_UNDER_BLUR_WINDOW = globalThis?.window?.electron
  ? globalThis?.window.api?.canWindowBlur
  : false

export const IN_ELECTRON = !!globalThis["electron"]

declare const ELECTRON: boolean
/**
 * Current build type for electron
 */
export const ELECTRON_BUILD = !!ELECTRON
export const WEB_BUILD = !ELECTRON
