import { app, protocol } from "electron"
import path from "pathe"

const e2eUserDataDir = process.env.FOLO_E2E_USER_DATA_DIR

if (e2eUserDataDir) {
  app.setPath("userData", e2eUserDataDir)
} else if (import.meta.env.DEV) {
  app.setPath("userData", path.join(app.getPath("appData"), "Folo(dev)"))
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app",
    privileges: {
      standard: true,
      bypassCSP: true,
      supportFetchAPI: true,
      secure: true,
    },
  },
])
