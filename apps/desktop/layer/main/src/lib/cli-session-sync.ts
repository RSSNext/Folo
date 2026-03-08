import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"

import { env } from "@follow/shared/env.desktop"
import { join } from "pathe"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { logger } from "../logger"

const CLI_CONFIG_DIR = join(homedir(), ".folo")
const CLI_CONFIG_PATH = join(CLI_CONFIG_DIR, "config.json")

interface CliConfig {
  token?: string
  apiUrl?: string
}

const readCliConfig = async (): Promise<CliConfig> => {
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

export const syncSessionToCliConfig = async (token: string | undefined): Promise<void> => {
  const config = await readCliConfig()

  if (token) {
    config.token = token
    config.apiUrl = env.VITE_API_URL
  } else {
    delete config.token
  }

  await writeCliConfig(config)
  logger.info(`CLI config synced (token ${token ? "set" : "cleared"})`)
}
