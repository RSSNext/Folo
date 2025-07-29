import type { BrowserWindow } from "electron"
import { useEffect, useLayoutEffect, useRef } from "react"
import type { toast } from "sonner"

import type { GeneralSettings, UISettings } from "./settings/interface"

const PREFIX = "__follow"

// eslint-disable-next-line unused-imports/no-unused-vars
declare const dialog: {
  ask: (options: {
    title: string
    message: string
    onConfirm?: () => void
    onCancel?: () => void
    confirmText?: string
    cancelText?: string
  }) => Promise<boolean>
}

export enum WindowState {
  MINIMIZED = "minimized",
  MAXIMIZED = "maximized",
  NORMAL = "normal",
}
interface RenderGlobalContext {
  /// Access Settings
  showSetting: (path?: string) => void
  getGeneralSettings: () => GeneralSettings
  getUISettings: () => UISettings

  /**
   * @description only work in electron app
   */
  onWindowClose: () => void
  /**
   * @description only work in electron app
   */
  onWindowShow: () => void

  /// Actions
  follow: (options?: { isList: boolean; id?: string; url?: string }) => void
  profile: (id: string, variant?: "drawer" | "dialog") => void
  quickAdd: () => void
  rsshubRoute: (route: string) => void
  // Navigate
  goToDiscover: () => void
  goToFeed: ({ id, view }: { id: string; view?: number }) => void
  goToList: ({ id, view }: { id: string; view?: number }) => void

  // user data
  clearIfLoginOtherAccount: (newUserId: string) => void
  applyOneTimeToken: (token: string) => void

  /// Utils
  toast: typeof toast

  /// Electron State
  setWindowState: (state: WindowState) => void

  readyToUpdate: () => void
  dialog: typeof dialog
  // URL
  getWebUrl: () => string
  getApiUrl: () => string

  // View
  zenMode: () => void

  // Utils
  invalidateQuery: (queryKey: string | string[]) => void
  navigateEntry: (options: { feedId: string; entryId: string; view: number }) => void
  updateDownloaded: () => void

  refreshSession: () => void
}

export const registerGlobalContext = (context: Partial<RenderGlobalContext>) => {
  // @ts-ignore
  globalThis[PREFIX] = {
    // @ts-ignore
    ...globalThis[PREFIX],
    ...context,
  }
}

export const useRegisterGlobalContext = <K extends keyof RenderGlobalContext>(
  key: K,
  fn: RenderGlobalContext[K],
) => {
  const eventCallbackRef = useRef(fn)
  useLayoutEffect(() => {
    eventCallbackRef.current = fn
  }, [fn])

  useEffect(() => {
    registerGlobalContext({ [key]: eventCallbackRef.current })
  }, [key])
}

function createProxy<T extends RenderGlobalContext>(
  evalCode: (code: string) => void,
  path: string[] = [],
): T {
  return new Proxy((() => {}) as any, {
    get(_, prop: string) {
      const newPath = [...path, prop]

      return createProxy(evalCode, newPath)
    },
    async apply(_, __, args: any[]) {
      const methodPath = path.join(".")

      try {
        return await evalCode(
          `globalThis.${PREFIX}?.${methodPath}?.(${args
            .map((arg) => {
              if (arg === undefined) return "undefined"
              return JSON.stringify(arg)
            })
            .join(",")})`,
        )
      } catch (err) {
        console.error(`Failed to executeJavaScript: ${methodPath}`, err)
      }
    },
  })
}
type AddPromise<T> = T extends (...args: infer A) => Promise<infer R>
  ? (...args: A) => Promise<R>
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : unknown

type Fn<T> = {
  [K in keyof T]: AddPromise<T[K]> &
    (T[K] extends object ? { [P in keyof T[K]]: AddPromise<T[K][P]> } : never)
}
export function callWindowExpose<T extends RenderGlobalContext>(window: BrowserWindow) {
  return createProxy((code) => window.webContents.executeJavaScript(code)) as Fn<T>
}

export function callWebviewExpose<T extends RenderGlobalContext>(
  injectCode: (code: string) => void,
) {
  return createProxy(injectCode) as Fn<T>
}

export function callWindowExposeRenderer() {
  // @ts-ignore
  return globalThis[PREFIX] as Fn<RenderGlobalContext>
}
