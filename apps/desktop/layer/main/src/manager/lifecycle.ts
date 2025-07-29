import { app } from "electron"

import { WindowManager } from "~/manager/window"

class LifecycleManagerStatic {
  private static instance: LifecycleManagerStatic

  private constructor() {
    this.registerListeners()
  }

  public static getInstance(): LifecycleManagerStatic {
    if (!LifecycleManagerStatic.instance) {
      LifecycleManagerStatic.instance = new LifecycleManagerStatic()
    }
    return LifecycleManagerStatic.instance
  }

  private registerListeners() {
    app.on("window-all-closed", this.onWindowAllClosed.bind(this))
    app.on("activate", this.onActivate.bind(this))
  }

  private onWindowAllClosed() {
    if (process.platform !== "darwin") {
      app.quit()
    }
  }

  private onActivate() {
    const mainWindow = WindowManager.getMainWindowOrCreate()
    mainWindow.show()
    mainWindow.focus()
  }

  public onReady(callback: () => void) {
    if (app.isReady()) {
      callback()
    } else {
      app.on("ready", callback)
    }
  }
}

export const LifecycleManager = LifecycleManagerStatic.getInstance()
