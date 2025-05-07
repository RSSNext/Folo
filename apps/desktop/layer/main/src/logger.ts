import { app, shell } from "electron"
import log from "electron-log"

export const logger = log.scope("main")
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
