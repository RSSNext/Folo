import { app, shell } from "electron"
import log from "electron-log"
import path from "pathe"

import { e2eUserDataDir } from "./env"

export const logger = log.scope("main")
// End-to-end runs log next to their temporary profile. By default macOS keeps the log under the
// app's name, which is the installed app's log.
if (e2eUserDataDir) {
  const logDir = path.join(e2eUserDataDir, "logs")
  log.transports.file.resolvePathFn = (variables) =>
    path.join(logDir, variables.fileName ?? "main.log")
}
log.initialize()

export function getLogFilePath() {
  return log.transports.file.getFile().path
}

export async function revealLogFile() {
  const filePath = getLogFilePath()
  return await shell.openPath(filePath)
}

app.on("before-quit", () => {
  logger.info("App is quitting")
  log.transports.console.level = false
})

app.on("will-quit", () => {
  logger.info("App will quit")
})
