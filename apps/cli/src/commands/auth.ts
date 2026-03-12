import type { Command } from "commander"

import { parsePositiveInt } from "../args"
import { loginWithBrowser } from "../browser-login"
import { getGlobalOptions } from "../client"
import { runCommand } from "../command"
import { clearToken, getConfigPath, updateConfig } from "../config"
import { CLIError } from "../output"

interface AuthLoginOptions {
  token?: string
  timeout?: number
}

export const registerAuthCommand = (program: Command) => {
  const authCommand = program.command("auth").description("Authentication commands")

  authCommand
    .command("login")
    .description("Sign in via browser (or save a provided token) and verify authentication")
    .option("--token <token>", "Session token from Folo")
    .option(
      "--timeout <seconds>",
      "Browser login timeout in seconds (default: 180)",
      parsePositiveInt,
    )
    .action(async function (this: Command, options: AuthLoginOptions) {
      await runCommand(
        this,
        async ({ client, options: globalOptions }) => {
          let token = options.token ?? getGlobalOptions(this).token
          if (!token) {
            const timeoutMs = (options.timeout ?? 180) * 1000
            const browserLogin = await loginWithBrowser({
              apiUrl: globalOptions.apiUrl,
              timeoutMs,
              onStatus: (message) => {
                console.error(`[auth] ${message}`)
              },
            })
            token = browserLogin.token
          }

          client.setAuthToken(token)
          const session = await client.api.auth.getSession()

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
    })

  authCommand
    .command("logout")
    .description("Clear stored token")
    .action(async function (this: Command) {
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
    })

  authCommand
    .command("whoami")
    .description("Show current session user")
    .action(async function (this: Command) {
      await runCommand(this, async ({ client }) => {
        const session = await client.api.auth.getSession()
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
    })
}
