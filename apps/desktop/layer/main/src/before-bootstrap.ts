import path from "node:path"

import { app, protocol } from "electron"

import { initializeSentry } from "./sentry"

if (import.meta.env.DEV) app.setPath("userData", path.join(app.getPath("appData"), "Folo(dev)"))
protocol.registerSchemesAsPrivileged([
  {
    scheme: "sentry-ipc",
    privileges: { bypassCSP: true, corsEnabled: true, supportFetchAPI: true, secure: true },
  },
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
// Solve Sentry SDK should be initialized before the Electron app 'ready' event is fired
initializeSentry()
