// HACK: Use expose the navigate function in the window object, avoid to import `router` circular issue.
import type { SettingModalOptions } from "./useSettingModal"

const getShowSettings = () => {
  const showSettings = window.router?.showSettings
  return typeof showSettings === "function" ? showSettings : null
}

export const showSettings = (args?: SettingModalOptions) => {
  const currentShowSettings = getShowSettings()
  if (currentShowSettings) {
    currentShowSettings(args)
    return
  }

  let retryCount = 0
  const retry = () => {
    const nextShowSettings = getShowSettings()
    if (nextShowSettings) {
      nextShowSettings(args)
      return
    }

    retryCount += 1
    if (retryCount >= 20) {
      console.error("[Settings] window.router.showSettings is not ready")
      return
    }

    window.setTimeout(retry, 50)
  }

  window.setTimeout(retry)
}

export const useSettingModal = () => showSettings
