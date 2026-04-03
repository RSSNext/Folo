import { execFile } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { promisify } from "node:util"

import { env } from "@follow/shared/env.desktop"
import { createAuthRequestOriginHeaders, createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"
import { join } from "pathe"

import { BETTER_AUTH_COOKIE_NAME_SESSION_TOKEN } from "~/constants/app"
import { WindowManager } from "~/manager/window"

import { logger } from "../logger"
import { buildManagedAuthCookieHeader, getManagedAuthCookies } from "./auth-cookies"
import { resolveCliSessionToken } from "./cli-login-token"

const execFileAsync = promisify(execFile)
export const CLI_NPM_PACKAGE_NAME = "folocli"
const CLI_NPX_PACKAGE_SPEC = `${CLI_NPM_PACKAGE_NAME}@latest`
const CLI_CONFIG_DIR = join(homedir(), ".folo")
const CLI_CONFIG_PATH = join(CLI_CONFIG_DIR, "config.json")
const getNpxCommand = () => (process.platform === "win32" ? "npx.cmd" : "npx")

const getCliSyncRequestHeaders = (additionalHeaders?: Record<string, string>) => ({
  ...createDesktopAPIHeaders({ version: PKG.version }),
  ...createAuthRequestOriginHeaders(env.VITE_WEB_URL),
  ...additionalHeaders,
})

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

export const getCliLoginCommand = () => `npx --yes ${CLI_NPX_PACKAGE_SPEC} login --token <token>`

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

const generateOneTimeTokenFromCurrentSession = async (): Promise<string | undefined> => {
  const window = WindowManager.getMainWindow()
  if (!window) return undefined

  const cookieHeader = buildManagedAuthCookieHeader(
    await getManagedAuthCookies({
      apiURL: env.VITE_API_URL,
      session: window.webContents.session,
    }),
  )

  if (!cookieHeader) {
    return undefined
  }

  const response = await fetch(`${env.VITE_API_URL}/better-auth/one-time-token/generate`, {
    method: "GET",
    headers: getCliSyncRequestHeaders({
      Cookie: cookieHeader,
    }),
  })

  if (!response.ok) {
    return undefined
  }

  const data = (await response.json().catch(() => null)) as { token?: unknown } | null
  return typeof data?.token === "string" ? data.token : undefined
}

const resolveSessionTokenFromOneTimeToken = async (
  oneTimeToken: string,
): Promise<string | undefined> => {
  const response = await fetch(`${env.VITE_API_URL}/better-auth/one-time-token/apply`, {
    method: "POST",
    headers: getCliSyncRequestHeaders({
      "content-type": "application/json",
    }),
    body: JSON.stringify({ token: oneTimeToken }),
  })

  if (!response.ok) {
    return undefined
  }

  const setCookieValues =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : ([response.headers.get("set-cookie")].filter(Boolean) as string[])
  for (const setCookie of setCookieValues) {
    const match = setCookie.match(/(?:__Secure-)?better-auth\.session_token=([^;]+)/)
    if (match?.[1]) {
      return match[1]
    }
  }

  const data = (await response.json().catch(() => null)) as { session?: { token?: unknown } } | null
  return typeof data?.session?.token === "string" ? data.session.token : undefined
}

export const getCliSessionToken = async ({
  preferredToken,
}: {
  preferredToken?: string
} = {}): Promise<string | undefined> => {
  const oneTimeToken = await generateOneTimeTokenFromCurrentSession().catch((error) => {
    logger.error("Failed to generate one-time token for CLI sync:", error)
    return
  })

  if (oneTimeToken) {
    const sessionToken = await resolveSessionTokenFromOneTimeToken(oneTimeToken).catch((error) => {
      logger.error("Failed to resolve session token from one-time token:", error)
      return
    })

    if (sessionToken) {
      return sessionToken
    }
  }

  return resolveCliSessionToken({
    preferredToken,
    cookieToken: await getSessionTokenFromCookies(),
  })
}

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
