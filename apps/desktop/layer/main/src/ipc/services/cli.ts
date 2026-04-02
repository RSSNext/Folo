import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"

import {
  CLI_NPM_PACKAGE_NAME,
  getCliConfigPath,
  getCliInstallCommand,
  getCliLoginCommand,
  getSessionTokenFromCookies,
  isCliRunnerAvailable,
  readCliConfig,
  resolveCliSessionToken,
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
  async getInstallStatus(_context: IpcContext): Promise<CliInstallStatus> {
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
  async installCli(
    _context: IpcContext,
    preferredToken?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await isCliRunnerAvailable())) {
        return { success: false, error: "npx is not available. Install Node.js and npm first." }
      }

      const token = resolveCliSessionToken({
        preferredToken,
        cookieToken: await getSessionTokenFromCookies(),
      })
      if (!token) {
        return { success: false, error: "Sign in to Folo Desktop first." }
      }

      await syncSessionToCliConfig(token)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync CLI login",
      }
    }
  }

  @IpcMethod()
  async uninstallCli(_context: IpcContext): Promise<{ success: boolean; error?: string }> {
    try {
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
