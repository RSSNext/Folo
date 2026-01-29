import { app, shell } from "electron"
import log from "electron-log"

export const logger = log.scope("main")
log.initialize()

// Fix EPIPE error: Wrap console transport to suppress errors when stdout/stderr are closed
if (app.isPackaged) {
  const originalWriteFn = log.transports.console.writeFn
  log.transports.console.writeFn = ({ message, level }) => {
    try {
      originalWriteFn({ message, level })
    } catch (error: any) {
      // Suppress EPIPE errors that occur when console is not available
      if (error?.code !== "EPIPE") {
        // Re-throw other errors
        throw error
      }
    }
  }
}

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
