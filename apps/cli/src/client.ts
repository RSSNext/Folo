import { FollowClient } from "@follow-app/client-sdk"
import type { Command } from "commander"

import type { FoloCLIConfig } from "./config"
import { readConfig } from "./config"
import type { OutputFormat } from "./output"
import { CLIError, readJSONBody } from "./output"

export const defaultApiURL = "https://api.folo.is"

const readString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const normalizeToken = (token: string | undefined) => {
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

export interface CLIAuthSession {
  user: Record<string, unknown>
  session: Record<string, unknown>
  role?: unknown
  roleEndAt?: unknown
  feedSubscriptionLimit?: unknown
  rsshubSubscriptionLimit?: unknown
}

/**
 * What the API said about a failed session check. Only its JSON says anything: the body of
 * another server, such as the page a web server answers a missing path with, would fill the
 * message with HTML.
 */
const readSessionErrorMessage = async (response: Response): Promise<string | undefined> => {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) return undefined

  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null
  return typeof data?.message === "string" ? data.message : undefined
}

export const fetchAuthSession = async ({
  apiUrl,
  token,
  verbose = false,
}: {
  apiUrl: string
  token: string
  verbose?: boolean
}): Promise<CLIAuthSession> => {
  const requestUrl = `${apiUrl}/better-auth/get-session`
  if (verbose) {
    console.error(`[request] GET ${requestUrl}`)
  }

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Cookie: `__Secure-better-auth.session_token=${token}; better-auth.session_token=${token}`,
    },
  })

  if (verbose) {
    console.error(`[response] GET ${requestUrl} -> ${response.status}`)
  }

  if (response.status === 401 || response.status === 403) {
    const message = await readSessionErrorMessage(response)
    throw new CLIError("UNAUTHORIZED", message || "Token is invalid or expired.")
  }

  // Any other failure, such as a wrong API URL answering 404, says nothing about the token
  if (!response.ok) {
    const message = await readSessionErrorMessage(response)
    throw new CLIError(
      `HTTP_${response.status}`,
      message || response.statusText || `Session check failed with HTTP ${response.status}.`,
    )
  }

  // A token the API does not know, or a session signed out elsewhere, is answered with a null
  // body. A body that is not JSON comes from something else than the API, not from the token.
  const body = await readJSONBody(response, apiUrl)
  if (!isRecord(body) || !isRecord(body.user) || !isRecord(body.session)) {
    throw new CLIError("UNAUTHORIZED", "Token is invalid or expired.")
  }

  return body as unknown as CLIAuthSession
}

/**
 * The API URL requests append their paths to, without trailing slashes: an URL saved as
 * `http://localhost:3000/` sent the session check to `//better-auth/get-session`.
 */
export const resolveApiUrl = (value: string): string => {
  const apiUrl = value.trim().replace(/\/+$/, "")

  let url: URL
  try {
    url = new URL(apiUrl)
  } catch {
    throw new CLIError("INVALID_ARGUMENT", `Invalid API URL: ${value}`)
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new CLIError("INVALID_ARGUMENT", `Invalid API URL: ${value}. Use an http or https URL.`)
  }

  return apiUrl
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
  const apiUrl = resolveApiUrl(globalOptions.apiUrl ?? config.apiUrl ?? defaultApiURL)

  if (requireAuth && !token) {
    throw new CLIError(
      "UNAUTHORIZED",
      "Missing token. Run `folo login` (browser sign-in) or set FOLO_TOKEN.",
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

  // Without an error interceptor the SDK throws what fetch threw, so a request it gave up on
  // failed as a bare AbortError. One that returns nothing keeps the SDK's own handling, which
  // reports its timeout as a FollowTimeoutError.
  client.addErrorInterceptor(() => {})

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
