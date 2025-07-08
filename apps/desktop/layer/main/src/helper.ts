import { fileURLToPath, pathToFileURL } from "node:url"

import { MODE, ModeEnum } from "@follow/shared/constants"
import path from "pathe"

import { isMacOS, isWindows } from "./env"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const iconMap = {
  [ModeEnum.production]: path.join(__dirname, "../../resources/icon.png"),
  [ModeEnum.development]: path.join(__dirname, "../../resources/icon-dev.png"),
  [ModeEnum.staging]: path.join(__dirname, "../../resources/icon-staging.png"),
}
export const getIconPath = () => iconMap[MODE]
export const getTrayIconPath = () => {
  if (isMacOS) {
    return path.join(__dirname, "../../resources/icon-tray.png")
  }
  if (isWindows) {
    // https://www.electronjs.org/docs/latest/api/tray#:~:text=Windows,best%20visual%20effects.
    return MODE === ModeEnum.staging
      ? path.join(__dirname, "../../resources/icon-tray-staging.ico")
      : path.join(__dirname, "../../resources/icon-tray.ico")
  }
  return getIconPath()
}

export const filePathToAppUrl = (filePath: string) => {
  return `app://folo.is${pathToFileURL(filePath).pathname}`
}
