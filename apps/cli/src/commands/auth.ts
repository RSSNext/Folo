import type { Command } from "commander"

import { parsePositiveInt } from "../args"
import { loginWithBrowser, resolveBrowserLoginToken } from "../browser-login"
import { fetchAuthSession, getGlobalOptions, normalizeToken } from "../client"
import { runCommand } from "../command"
import { clearToken, getConfigPath, updateConfig } from "../config"
import { CLIError } from "../output"

export const resolveLoginToken = async ({
  inputToken,
  apiUrl,
  timeoutMs,
  onStatus,
}: {
  inputToken?: string
  apiUrl: string
  timeoutMs: number
  onStatus: (message: string) => void
}) => {
  if (inputToken) {
    return await resolveBrowserLoginToken(apiUrl, inputToken)
  }

  const browserLogin = await loginWithBrowser({
    apiUrl,
    timeoutMs,
    onStatus,
  })

  return browserLogin.token
}

interface AuthLoginOptions {
  token?: string
  timeout?: number
}

const runLoginAction = async function (this: Command, options: AuthLoginOptions) {
  await runCommand(
    this,
    async ({ client, options: globalOptions }) => {
      const resolvedToken = await resolveLoginToken({
        inputToken: options.token ?? getGlobalOptions(this).token,
        apiUrl: globalOptions.apiUrl,
        timeoutMs: (options.timeout ?? 180) * 1000,
        onStatus: (message) => {
          console.error(`[auth] ${message}`)
        },
      })

      const token = normalizeToken(resolvedToken) ?? resolvedToken
      client.setAuthToken(token)
      const session = await fetchAuthSession({
        apiUrl: globalOptions.apiUrl,
        token,
        verbose: globalOptions.verbose,
      })

      if (!session.user || !session.session) {
        throw new CLIError("UNAUTHORIZED", "Token is invalid or expired.")
      }

      await updateConfig({
        token,
        apiUrl: globalOptions.apiUrl,
      })

      return {
        message: "Login successful.",
        configPath: getConfigPath(),
        user: session.user,
      }
    },
    { requireAuth: false },
  )
}

const runLogoutAction = async function (this: Command) {
  await runCommand(
    this,
    async () => {
      await clearToken()
      return {
        message: "Logged out.",
        configPath: getConfigPath(),
      }
    },
    { requireAuth: false },
  )
}

const runWhoamiAction = async function (this: Command) {
  await runCommand(this, async ({ token, options: globalOptions }) => {
    if (!token) {
      throw new CLIError("UNAUTHORIZED", "Missing token.")
    }

    const session = await fetchAuthSession({
      apiUrl: globalOptions.apiUrl,
      token,
      verbose: globalOptions.verbose,
    })
    if (!session.user || !session.session) {
      throw new CLIError("UNAUTHORIZED", "Token is invalid or expired.")
    }

    return {
      user: session.user,
      session: session.session,
      role: session.role,
      roleEndAt: session.roleEndAt ?? null,
      feedSubscriptionLimit: session.feedSubscriptionLimit,
      rsshubSubscriptionLimit: session.rsshubSubscriptionLimit,
    }
  })
}

const registerLoginCommand = (program: Command, name: string, description: string) => {
  program
    .command(name)
    .description(description)
    .option("--token <token>", "Session or one-time token from Folo")
    .option(
      "--timeout <seconds>",
      "Browser login timeout in seconds (default: 180)",
      parsePositiveInt,
    )
    .action(runLoginAction)
}

const registerLogoutCommand = (program: Command, name: string, description: string) => {
  program.command(name).description(description).action(runLogoutAction)
}

const registerWhoamiCommand = (program: Command, name: string, description: string) => {
  program.command(name).description(description).action(runWhoamiAction)
}

export const registerAuthCommand = (program: Command) => {
  const authCommand = program.command("auth").description("Authentication commands")

  registerLoginCommand(
    authCommand,
    "login",
    "Sign in via browser (or save a provided token) and verify authentication",
  )
  registerLogoutCommand(authCommand, "logout", "Clear stored token")
  registerWhoamiCommand(authCommand, "whoami", "Show current session user")

  registerLoginCommand(program, "login", "Sign in and store a CLI session")
  registerLogoutCommand(program, "logout", "Clear the stored CLI session")
  registerWhoamiCommand(program, "whoami", "Show the current CLI session user")
}
