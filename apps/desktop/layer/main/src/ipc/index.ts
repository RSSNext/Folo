import type { MergeIpcService } from "electron-ipc-decorator"
import { createServices } from "electron-ipc-decorator"

import { AppService } from "./services/app"
import { AuthService } from "./services/auth"
import { DebugService } from "./services/debug"
import { DockService } from "./services/dock"
import { IntegrationService } from "./services/integration"
import { MenuService } from "./services/menu"
import { ReaderService } from "./services/reader"
import { SettingService } from "./services/setting"

// Initialize all services
const services = createServices([
  AppService,
  AuthService,
  DebugService,
  DockService,
  MenuService,
  ReaderService,
  SettingService,
  IntegrationService,
])
// Extract method types automatically from services
export type IpcServices = MergeIpcService<typeof services>

// Initialize all services (this will register all IPC handlers)
export function initializeIpcServices() {
  // Services are already initialized in the services constant above
  console.info("IPC services initialized")
  void services
}
