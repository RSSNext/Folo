import { FollowClient } from "@follow-app/client-sdk"
import type { Command } from "commander"

import type { FoloCLIConfig } from "./config"
import { readConfig } from "./config"
import type { OutputFormat } from "./output"
import { CLIError } from "./output"

export const defaultApiURL = "https://api.folo.is"

const readString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

const normalizeToken = (token: string | undefined) => {
  if (!token || !token.includes("%")) {
    return token
  }

  try {
    return decodeURIComponent(token)
  } catch {
    return token
  }
}

export interface GlobalOptions {
  format: OutputFormat
  apiUrl?: string
  token?: string
  verbose: boolean
}

export interface ResolvedGlobalOptions extends GlobalOptions {
  apiUrl: string
}

export interface CommandContext {
  client: FollowClient
  options: ResolvedGlobalOptions
  config: FoloCLIConfig
  token?: string
}

export const getGlobalOptions = (command: Command): GlobalOptions => {
  const options = command.optsWithGlobals() as Record<string, unknown>

  return {
    format:
      options.format === "table" || options.format === "plain" || options.format === "json"
        ? options.format
        : "json",
    apiUrl: readString(options.apiUrl),
    token: readString(options.token),
    verbose: Boolean(options.verbose),
  }
}

const setupVerboseLogging = (client: FollowClient) => {
  client.addRequestInterceptor((ctx) => {
    const method = ctx.options.method || "GET"
    console.error(`[request] ${method} ${ctx.url}`)
    return ctx
  })

  client.addResponseInterceptor((ctx) => {
    const method = ctx.options.method || "GET"
    console.error(`[response] ${method} ${ctx.url} -> ${ctx.response.status}`)
    return ctx.response
  })
}

export const createCommandContext = async (
  command: Command,
  requireAuth = true,
): Promise<CommandContext> => {
  const globalOptions = getGlobalOptions(command)
  const config = await readConfig()
  const token = normalizeToken(globalOptions.token ?? process.env.FOLO_TOKEN ?? config.token)
  const apiUrl = globalOptions.apiUrl ?? config.apiUrl ?? defaultApiURL

  if (requireAuth && !token) {
    throw new CLIError(
      "UNAUTHORIZED",
      "Missing token. Run `folo auth login` (browser sign-in) or set FOLO_TOKEN.",
    )
  }

  const client = new FollowClient({
    baseURL: apiUrl,
  })

  if (token) {
    client.setAuthToken(token)
    client.setHeaders({
      Cookie: `__Secure-better-auth.session_token=${token}; better-auth.session_token=${token}`,
    })
  }

  if (globalOptions.verbose) {
    setupVerboseLogging(client)
  }

  return {
    client,
    token,
    config,
    options: {
      ...globalOptions,
      apiUrl,
    },
  }
}
