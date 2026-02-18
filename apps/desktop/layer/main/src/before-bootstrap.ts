import { app, protocol } from "electron"
import path from "pathe"

if (import.meta.env.DEV) app.setPath("userData", path.join(app.getPath("appData"), "Folo(dev)"))
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
