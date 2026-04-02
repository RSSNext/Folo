import { execFile } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { promisify } from "node:util"

import { env } from "@follow/shared/env.desktop"
import { join } from "pathe"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { logger } from "../logger"

const execFileAsync = promisify(execFile)
export const CLI_NPM_PACKAGE_NAME = "folocli"
const CLI_NPX_PACKAGE_SPEC = `${CLI_NPM_PACKAGE_NAME}@latest`
const CLI_CONFIG_DIR = join(homedir(), ".folo")
const CLI_CONFIG_PATH = join(CLI_CONFIG_DIR, "config.json")
const getNpxCommand = () => (process.platform === "win32" ? "npx.cmd" : "npx")

export interface CliConfig {
  token?: string
  apiUrl?: string
}

export const readCliConfig = async (): Promise<CliConfig> => {
  try {
    const raw = await readFile(CLI_CONFIG_PATH, "utf8")
    return JSON.parse(raw) as CliConfig
  } catch {
    return {}
  }
}

const writeCliConfig = async (config: CliConfig): Promise<void> => {
  await mkdir(CLI_CONFIG_DIR, { recursive: true })
  await writeFile(CLI_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8")
}

export const getCliConfigPath = () => CLI_CONFIG_PATH

export const getCliInstallCommand = () => `npx --yes ${CLI_NPX_PACKAGE_SPEC} --help`

export const getCliLoginCommand = () =>
  `npx --yes ${CLI_NPX_PACKAGE_SPEC} login --token <session-token>`

const runCliCommand = async (args: string[]) => {
  await execFileAsync(getNpxCommand(), ["--yes", CLI_NPX_PACKAGE_SPEC, ...args], {
    windowsHide: true,
    timeout: 120_000,
    maxBuffer: 1024 * 1024,
  })
}

export const isCliRunnerAvailable = async (): Promise<boolean> => {
  try {
    await execFileAsync(getNpxCommand(), ["--version"], {
      windowsHide: true,
      timeout: 10_000,
      maxBuffer: 128 * 1024,
    })
    return true
  } catch {
    return false
  }
}

const clearCliConfigToken = async () => {
  const config = await readCliConfig()
  if (!config.token) {
    return
  }

  delete config.token
  await writeCliConfig(config)
}

export const getSessionTokenFromCookies = async (): Promise<string | undefined> => {
  const window = WindowManager.getMainWindow()
  if (!window) return undefined

  const cookies = await window.webContents.session.cookies.get({
    domain: new URL(env.VITE_API_URL).hostname,
  })

  const sessionCookie = cookies.find((cookie) =>
    cookie.name.includes(BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN),
  )

  return sessionCookie?.value
}

export const resolveCliSessionToken = ({
  preferredToken,
  cookieToken,
}: {
  preferredToken?: string
  cookieToken?: string
}) => preferredToken || cookieToken

export const syncSessionToCliConfig = async (token?: string): Promise<void> => {
  if (token) {
    const config = await readCliConfig()
    if (config.token === token && config.apiUrl === env.VITE_API_URL) {
      return
    }

    if (!(await isCliRunnerAvailable())) {
      throw new Error("npx is not available")
    }

    await runCliCommand(["login", "--token", token, "--api-url", env.VITE_API_URL])
    logger.info("CLI login synced via npx")
    return
  }

  if (await isCliRunnerAvailable()) {
    try {
      await runCliCommand(["logout"])
      logger.info("CLI login cleared via npx")
      return
    } catch (error) {
      logger.error(
        "Failed to clear CLI login via npx, falling back to local config cleanup:",
        error,
      )
    }
  }

  await clearCliConfigToken()
  logger.info("CLI login cleared from local config")
}
