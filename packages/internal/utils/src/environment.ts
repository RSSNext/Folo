import { IN_ELECTRON, MODE } from "@follow/shared/constants"
import { nanoid } from "nanoid"

import { detectBrowser, getOS } from "./utils"

declare const APP_VERSION: string
export const appSessionTraceId = nanoid()

export const getCurrentEnvironment = () => {
  const ua = navigator.userAgent
  const appVersion = APP_VERSION
  const env = IN_ELECTRON ? "electron" : "web"
  const os = getOS()
  const browser = detectBrowser()

  return [
    "### Environment",
    "",
    `**App Version**: ${appVersion}`,
    `**OS**: ${os}`,
    `**User Agent**: ${ua}`,
    `**Env**: ${env}`,
    `**Browser**: ${browser}`,
    `**Session Trace Id**: \`${appSessionTraceId}\``,
    `**Mode**: ${MODE}`,
  ]
}
