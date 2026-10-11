import { execFile } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { promisify } from "node:util"

import { env } from "@follow/shared/env.desktop"
import { createAuthRequestOriginHeaders, createDesktopAPIHeaders } from "@follow/utils/headers"
import PKG from "@pkg"
import { net } from "electron"
import { join } from "pathe"

import { WindowManager } from "~/manager/window"

import { logger } from "../logger"
import {
  buildManagedAuthCookieHeader,
  getManagedAuthCookies,
  getPreferredSessionTokenCookie,
} from "./auth-cookies"
import { describeCliCommand, redactCliSecrets } from "./cli-command"
import { resolveCliSessionToken } from "./cli-login-token"
import { store } from "./store"

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

// The session is copied to the CLI only after the user connects it in the settings, and no longer
// once they disconnect it, so the token isn't written for users who never asked for the CLI
export const isCliSyncEnabled = () => store.get("cliSyncEnabled") === true
export const setCliSyncEnabled = (enabled: boolean) => store.set("cliSyncEnabled", enabled)

// The CLI stores the decoded token while the cookie keeps it URL encoded
const normalizeCliToken = (token: string | undefined) => {
  if (!token?.includes("%")) return token
  try {
    return decodeURIComponent(token)
  } catch {
    return token
  }
}

export const getCliInstallCommand = () => `npx --yes ${CLI_NPX_PACKAGE_SPEC} --help`

export const getCliLoginCommand = () => `npx --yes ${CLI_NPX_PACKAGE_SPEC} login --token <token>`

const runCliCommand = async (args: string[]) => {
  const fullArgs = ["--yes", CLI_NPX_PACKAGE_SPEC, ...args]
  try {
    await execFileAsync(getNpxCommand(), fullArgs, {
      windowsHide: true,
      timeout: 120_000,
      maxBuffer: 1024 * 1024,
    })
  } catch (error) {
    // The original error carries the whole command line, token included. Callers log it,
    // so replace it with one that says what failed without repeating the secret.
    const output =
      error && typeof error === "object" && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr.trim()
        : ""
    throw new Error(
      `${describeCliCommand(getNpxCommand(), fullArgs)} failed${output ? `: ${redactCliSecrets(output, fullArgs)}` : ""}`,
    )
  }
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

  const sessionCookie = getPreferredSessionTokenCookie(cookies)

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

  const response = await net.fetch(`${env.VITE_API_URL}/better-auth/one-time-token/generate`, {
    method: "GET",
    credentials: "omit",
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
  const response = await net.fetch(`${env.VITE_API_URL}/better-auth/one-time-token/apply`, {
    method: "POST",
    credentials: "omit",
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
    if (
      normalizeCliToken(config.token) === normalizeCliToken(token) &&
      config.apiUrl === env.VITE_API_URL
    ) {
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
