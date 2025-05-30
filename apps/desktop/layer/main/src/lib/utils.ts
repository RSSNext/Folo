import type { BrowserWindow } from "electron"

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
// To solve the vibrancy losing issue when leaving full screen mode
// @see https://github.com/toeverything/AFFiNE/blob/280e24934a27557529479a70ab38c4f5fc65cb00/packages/frontend/electron/src/main/windows-manager/main-window.ts:L157
export function refreshBound(window: BrowserWindow, timeout = 0) {
  setTimeout(() => {
    // FIXME: workaround for theme bug in full screen mode
    const size = window?.getSize()
    window?.setSize(size[0]! + 1, size[1]! + 1)
    window?.setSize(size[0]!, size[1]!)
  }, timeout)
}
