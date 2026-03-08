import { execSync } from "node:child_process"
import { existsSync, lstatSync, readlinkSync } from "node:fs"
import { unlink, writeFile } from "node:fs/promises"

import { app } from "electron"
import type { IpcContext } from "electron-ipc-decorator"
import { IpcMethod, IpcService } from "electron-ipc-decorator"
import path from "pathe"

import { logger } from "../../logger"

const CLI_BINARY_NAME = "folo"

const getDefaultInstallDir = (): string => {
  switch (process.platform) {
    case "win32": {
      return path.join(process.env.LOCALAPPDATA || "", "Folo", "bin")
    }
    default: {
      return "/usr/local/bin"
    }
  }
}

const getCliSourcePath = (): string => {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "cli", "index.js")
  }
  // In dev, read from the cli workspace directly
  return path.resolve(app.getAppPath(), "../../cli/dist/index.js")
}

const getCliInstallPath = (): string => {
  return path.join(getDefaultInstallDir(), CLI_BINARY_NAME)
}

export interface CliInstallStatus {
  installed: boolean
  installPath: string | null
  cliSourceAvailable: boolean
}

export class CliService extends IpcService {
  static override readonly groupName = "cli"

  @IpcMethod()
  async getInstallStatus(_context: IpcContext): Promise<CliInstallStatus> {
    const installPath = getCliInstallPath()
    const cliSourcePath = getCliSourcePath()
    const cliSourceAvailable = existsSync(cliSourcePath)

    try {
      if (!existsSync(installPath)) {
        return { installed: false, installPath: null, cliSourceAvailable }
      }

      const stats = lstatSync(installPath)
      if (stats.isSymbolicLink()) {
        const target = readlinkSync(installPath)
        // Check if the symlink points to our CLI
        const isOurs = target.includes("Folo") || target.includes("cli/index.js")
        return { installed: isOurs, installPath, cliSourceAvailable }
      }

      // Exists as a regular file - could be our wrapper script
      return { installed: true, installPath, cliSourceAvailable }
    } catch {
      return { installed: false, installPath: null, cliSourceAvailable }
    }
  }

  @IpcMethod()
  async installCli(_context: IpcContext): Promise<{ success: boolean; error?: string }> {
    const cliSource = getCliSourcePath()
    if (!existsSync(cliSource)) {
      return { success: false, error: "CLI bundle not found in app resources" }
    }

    const installPath = getCliInstallPath()
    const wrapperContent = `#!/bin/sh\nexec /usr/bin/env node "${cliSource}" "$@"\n`

    if (process.platform === "win32") {
      return this.installCliWindows(cliSource, installPath)
    }

    try {
      // Try without elevated permissions first
      await writeFile(installPath, wrapperContent, { mode: 0o755 })
      logger.info(`CLI installed at ${installPath}`)
      return { success: true }
    } catch {
      // Needs elevated permissions, use osascript on macOS
      if (process.platform === "darwin") {
        try {
          const escapedContent = wrapperContent.replaceAll('"', '\\"')
          execSync(
            `osascript -e 'do shell script "printf \\"${escapedContent}\\" > ${installPath} && chmod +x ${installPath}" with administrator privileges'`,
          )
          logger.info(`CLI installed at ${installPath} (with admin privileges)`)
          return { success: true }
        } catch (err) {
          logger.error("Failed to install CLI with admin privileges:", err)
          return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to install CLI",
          }
        }
      }

      // Linux: try with pkexec
      try {
        execSync(
          `pkexec sh -c 'printf "${wrapperContent.replaceAll('"', '\\"')}" > ${installPath} && chmod +x ${installPath}'`,
        )
        logger.info(`CLI installed at ${installPath} (with pkexec)`)
        return { success: true }
      } catch (err) {
        logger.error("Failed to install CLI:", err)
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to install CLI",
        }
      }
    }
  }

  @IpcMethod()
  async uninstallCli(_context: IpcContext): Promise<{ success: boolean; error?: string }> {
    const installPath = getCliInstallPath()

    if (!existsSync(installPath)) {
      return { success: true }
    }

    if (process.platform === "win32") {
      return this.uninstallCliWindows(installPath)
    }

    try {
      await unlink(installPath)
      logger.info(`CLI uninstalled from ${installPath}`)
      return { success: true }
    } catch {
      // Needs elevated permissions
      if (process.platform === "darwin") {
        try {
          execSync(
            `osascript -e 'do shell script "rm -f ${installPath}" with administrator privileges'`,
          )
          logger.info(`CLI uninstalled from ${installPath} (with admin privileges)`)
          return { success: true }
        } catch (err) {
          logger.error("Failed to uninstall CLI with admin privileges:", err)
          return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to uninstall CLI",
          }
        }
      }

      try {
        execSync(`pkexec rm -f ${installPath}`)
        logger.info(`CLI uninstalled from ${installPath} (with pkexec)`)
        return { success: true }
      } catch (err) {
        logger.error("Failed to uninstall CLI:", err)
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to uninstall CLI",
        }
      }
    }
  }

  private async installCliWindows(
    cliSource: string,
    installPath: string,
  ): Promise<{ success: boolean; error?: string }> {
    const installDir = path.dirname(installPath)
    const cmdContent = `@echo off\r\nnode "${cliSource}" %*\r\n`

    try {
      const { mkdirSync, writeFileSync } = await import("node:fs")
      mkdirSync(installDir, { recursive: true })
      writeFileSync(`${installPath}.cmd`, cmdContent)
      logger.info(`CLI installed at ${installPath}.cmd`)
      return { success: true }
    } catch (err) {
      logger.error("Failed to install CLI on Windows:", err)
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to install CLI",
      }
    }
  }

  private async uninstallCliWindows(
    installPath: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { unlinkSync } = await import("node:fs")
      const cmdPath = `${installPath}.cmd`
      if (existsSync(cmdPath)) {
        unlinkSync(cmdPath)
      }
      if (existsSync(installPath)) {
        unlinkSync(installPath)
      }
      logger.info(`CLI uninstalled from ${installPath}`)
      return { success: true }
    } catch (err) {
      logger.error("Failed to uninstall CLI on Windows:", err)
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to uninstall CLI",
      }
    }
  }
}
