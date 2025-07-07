import { app } from "electron"
import squirrelStartup from "electron-squirrel-startup"

import { DEVICE_ID } from "./constants/system"
import { BootstrapManager } from "./manager/bootstrap"

console.info("[main] device id:", DEVICE_ID)
if (squirrelStartup) {
  app.quit()
}

BootstrapManager.start()
