// HACK: Use expose the navigate function in the window object, avoid to import `router` circular issue.
import type { SettingModalOptions } from "./useSettingModal"

const showSettings = (args?: SettingModalOptions) => window.router.showSettings.call(null, args)

export const useSettingModal = () => showSettings
