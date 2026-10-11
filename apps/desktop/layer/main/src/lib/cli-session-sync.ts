import { execFile } from "node:child_process"
import { chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises"
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
import { resolveCliSessionToken } from "./cli-login-token"
import { store } from "./store"

const execFileAsync = promisify(execFile)
export const CLI_NPM_PACKAGE_NAME = "folocli"
const CLI_NPX_PACKAGE_SPEC = `${CLI_NPM_PACKAGE_NAME}@latest`
const CLI_CONFIG_DIR = join(homedir(), ".folo")
const CLI_CONFIG_PATH = join(CLI_CONFIG_DIR, "config.json")

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

// Only the user can read the token, and the file is replaced in one step so the CLI never reads
// it half written
const writeCliConfig = async (config: CliConfig): Promise<void> => {
  await mkdir(CLI_CONFIG_DIR, { recursive: true, mode: 0o700 })
  if (process.platform !== "win32") {
    await chmod(CLI_CONFIG_DIR, 0o700).catch(() => {})
  }
  const tempPath = `${CLI_CONFIG_PATH}.${process.pid}.tmp`
  await writeFile(tempPath, `${JSON.stringify(config, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  })
  await rename(tempPath, CLI_CONFIG_PATH)
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

const NPX_CHECK_OPTIONS = { windowsHide: true, timeout: 10_000, maxBuffer: 128 * 1024 }

// Whether the CLI can run here, which only the settings show: the login itself is written
// without npx
export const isCliRunnerAvailable = async (): Promise<boolean> => {
  if (process.platform === "win32") {
    // npx is a .cmd script, which Node only starts through a shell since CVE-2024-27980
    return execFileAsync("npx.cmd", ["--version"], { ...NPX_CHECK_OPTIONS, shell: true })
      .then(() => true)
      .catch(() => false)
  }

  // An app opened from the Dock or a launcher only gets the system PATH, without Homebrew,
  // nvm or the Node installer's directories, so the user's shell finds npx. It runs as an
  // interactive login shell, as nvm is usually loaded from the interactive startup file.
  const shell = process.env.SHELL || "/bin/sh"
  return execFileAsync(shell, ["-ilc", "npx --version"], NPX_CHECK_OPTIONS)
    .then(() => true)
    .catch(() =>
      execFileAsync("npx", ["--version"], {
        ...NPX_CHECK_OPTIONS,
        env: {
          ...process.env,
          PATH: [process.env.PATH, "/opt/homebrew/bin", "/usr/local/bin"].filter(Boolean).join(":"),
        },
      })
        .then(() => true)
        .catch(() => false),
    )
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

    // Written as `folocli login` writes it, without running the CLI: a spawned npx would need
    // to be found on the PATH and would expose the token in its arguments
    await writeCliConfig({
      ...config,
      token: normalizeCliToken(token),
      apiUrl: env.VITE_API_URL,
    })
    logger.info("CLI login synced")
    return
  }

  await clearCliConfigToken()
  logger.info("CLI login cleared")
}
