import { IpcMethod, IpcService } from "electron-ipc-decorator"

import {
  CLI_NPM_PACKAGE_NAME,
  getCliConfigPath,
  getCliInstallCommand,
  getCliLoginCommand,
  getCliSessionToken,
  getSessionTokenFromCookies,
  isCliRunnerAvailable,
  readCliConfig,
  setCliSyncEnabled,
  syncSessionToCliConfig,
} from "../../lib/cli-session-sync"

export interface CliInstallStatus {
  connected: boolean
  configPath: string
  hasDesktopSession: boolean
  installCommand: string
  loginCommand: string
  npxAvailable: boolean
  packageName: string
}

export class CliService extends IpcService {
  static override readonly groupName = "cli"

  @IpcMethod()
  async getInstallStatus(): Promise<CliInstallStatus> {
    const [config, npxAvailable, desktopToken] = await Promise.all([
      readCliConfig(),
      isCliRunnerAvailable(),
      getSessionTokenFromCookies(),
    ])

    return {
      connected: Boolean(config.token),
      configPath: getCliConfigPath(),
      hasDesktopSession: Boolean(desktopToken),
      installCommand: getCliInstallCommand(),
      loginCommand: getCliLoginCommand(),
      npxAvailable,
      packageName: CLI_NPM_PACKAGE_NAME,
    }
  }

  @IpcMethod()
  async installCli(preferredToken?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await getCliSessionToken({
        preferredToken,
      })
      if (!token) {
        return { success: false, error: "Sign in to Folo Desktop first." }
      }

      await syncSessionToCliConfig(token)
      setCliSyncEnabled(true)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync CLI login",
      }
    }
  }

  @IpcMethod()
  async uninstallCli(): Promise<{ success: boolean; error?: string }> {
    try {
      setCliSyncEnabled(false)
      await syncSessionToCliConfig()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear CLI login",
      }
    }
  }
}
