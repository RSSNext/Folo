import type { ExtractServiceMethods } from "./base"
import { AppService } from "./services/app"
import { AuthService } from "./services/auth"
import { DebugService } from "./services/debug"
import { DockService } from "./services/dock"
import { IntegrationService } from "./services/integration"
import { MenuService } from "./services/menu"
import { ReaderService } from "./services/reader"
import { SettingService } from "./services/setting"

// Initialize all services
export const services = {
  app: new AppService(),
  auth: new AuthService(),
  debug: new DebugService(),
  dock: new DockService(),
  menu: new MenuService(),
  reader: new ReaderService(),
  setting: new SettingService(),
  integration: new IntegrationService(),
} as const

// Extract method types automatically from services
export type IpcServices = {
  app: ExtractServiceMethods<AppService>
  auth: ExtractServiceMethods<AuthService>
  debug: ExtractServiceMethods<DebugService>
  dock: ExtractServiceMethods<DockService>
  menu: ExtractServiceMethods<MenuService>
  reader: ExtractServiceMethods<ReaderService>
  setting: ExtractServiceMethods<SettingService>
  integration: ExtractServiceMethods<IntegrationService>
}

// Initialize all services (this will register all IPC handlers)
export function initializeIpcServices() {
  // Services are already initialized in the services constant above
  console.info("IPC services initialized")
}
