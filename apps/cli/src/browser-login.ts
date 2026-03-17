import { spawnSync } from "node:child_process"
import { createServer } from "node:http"
import type { AddressInfo } from "node:net"

import { DEFAULT_VALUES } from "../../../packages/internal/shared/src/env.common"
import { CLIError } from "./output"

const LOCAL_CALLBACK_HOST = "127.0.0.1"
const LOCAL_CALLBACK_PATH = "/callback"
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000

const mappedWebOrigins: Array<{ apiOrigin: string; webOrigin: string }> = [
  {
    apiOrigin: new URL(DEFAULT_VALUES.PROD.API_URL).origin,
    webOrigin: new URL(DEFAULT_VALUES.PROD.WEB_URL).origin,
  },
  {
    apiOrigin: new URL(DEFAULT_VALUES.DEV.API_URL).origin,
    webOrigin: new URL(DEFAULT_VALUES.DEV.WEB_URL).origin,
  },
  {
    apiOrigin: new URL(DEFAULT_VALUES.LOCAL.API_URL).origin,
    webOrigin: new URL(DEFAULT_VALUES.LOCAL.WEB_URL).origin,
  },
]

const successPageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Folo CLI Login</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; line-height: 1.5;">
    <h1>Folo CLI login complete</h1>
    <p>You can close this window and return to your terminal.</p>
  </body>
</html>
`

const failurePageHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Folo CLI Login</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 20px; line-height: 1.5;">
    <h1>Folo CLI login failed</h1>
    <p>Missing token in callback URL. Please retry in terminal.</p>
  </body>
</html>
`

const getOpenBrowserCommand = (url: string): { command: string; args: string[] } => {
  if (process.platform === "darwin") {
    return { command: "open", args: [url] }
  }

  if (process.platform === "win32") {
    return { command: "cmd", args: ["/c", "start", "", url] }
  }

  return { command: "xdg-open", args: [url] }
}

const openBrowser = (url: string) => {
  const { command, args } = getOpenBrowserCommand(url)
  const result = spawnSync(command, args, {
    stdio: "ignore",
  })

  if (result.error || result.status !== 0) {
    throw new CLIError(
      "BROWSER_OPEN_FAILED",
      `Failed to open browser automatically. Open this URL manually: ${url}`,
    )
  }
}

export const resolveCLILoginUrl = (apiUrl: string, callbackUrl: string): string => {
  let api: URL
  try {
    api = new URL(apiUrl)
  } catch {
    throw new CLIError("INVALID_ARGUMENT", `Invalid API URL: ${apiUrl}`)
  }

  const mappedWebOrigin = mappedWebOrigins.find((item) => item.apiOrigin === api.origin)?.webOrigin
  const webUrl = new URL(mappedWebOrigin ?? api.origin)

  webUrl.pathname = "/login"
  webUrl.search = ""
  webUrl.hash = ""
  webUrl.searchParams.set("cli_callback", callbackUrl)

  return webUrl.toString()
}

export interface BrowserLoginOptions {
  apiUrl: string
  timeoutMs?: number
  onStatus?: (message: string) => void
}

export interface BrowserLoginResult {
  token: string
  callbackUrl: string
  loginUrl: string
}

export const loginWithBrowser = async (
  options: BrowserLoginOptions,
): Promise<BrowserLoginResult> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const onStatus = options.onStatus ?? (() => {})

  if (timeoutMs <= 0) {
    throw new CLIError("INVALID_ARGUMENT", "Browser login timeout must be greater than 0.")
  }

  const result = await new Promise<BrowserLoginResult>((resolve, reject) => {
    let settled = false
    let timer: NodeJS.Timeout | undefined

    const settle = (handler: () => void) => {
      if (settled) {
        return
      }
      settled = true
      if (timer) {
        clearTimeout(timer)
      }
      server.close(() => {
        handler()
      })
    }

    const server = createServer((req, res) => {
      const requestUrl = new URL(
        req.url ?? "/",
        `http://${req.headers.host ?? LOCAL_CALLBACK_HOST}`,
      )

      if (requestUrl.pathname !== LOCAL_CALLBACK_PATH) {
        res.statusCode = 404
        res.end("Not Found")
        return
      }

      const token = requestUrl.searchParams.get("token")
      if (!token) {
        res.statusCode = 400
        res.setHeader("content-type", "text/html; charset=utf-8")
        res.end(failurePageHtml)
        return
      }

      res.statusCode = 200
      res.setHeader("content-type", "text/html; charset=utf-8")
      res.end(successPageHtml)

      const callbackAddress = server.address() as AddressInfo | null
      const callbackUrl = callbackAddress
        ? `http://${LOCAL_CALLBACK_HOST}:${callbackAddress.port}${LOCAL_CALLBACK_PATH}`
        : ""
      const loginUrl = resolveCLILoginUrl(options.apiUrl, callbackUrl)

      settle(() => {
        resolve({
          token,
          callbackUrl,
          loginUrl,
        })
      })
    })

    server.once("error", (error) => {
      settle(() => {
        reject(
          new CLIError("NETWORK_ERROR", `Failed to start local callback server: ${error.message}`),
        )
      })
    })

    server.listen(0, LOCAL_CALLBACK_HOST, () => {
      const address = server.address() as AddressInfo | null
      if (!address) {
        settle(() => {
          reject(new CLIError("NETWORK_ERROR", "Failed to bind local callback server."))
        })
        return
      }

      const callbackUrl = `http://${LOCAL_CALLBACK_HOST}:${address.port}${LOCAL_CALLBACK_PATH}`
      const loginUrl = resolveCLILoginUrl(options.apiUrl, callbackUrl)

      onStatus(`Open this URL to sign in: ${loginUrl}`)

      try {
        openBrowser(loginUrl)
        onStatus("Browser opened. Waiting for login confirmation...")
      } catch (error) {
        onStatus((error as Error).message)
        onStatus("Waiting for login confirmation...")
      }

      timer = setTimeout(() => {
        settle(() => {
          reject(
            new CLIError(
              "TIMEOUT",
              "Timed out waiting for browser login. Please run `folo login` again.",
            ),
          )
        })
      }, timeoutMs)
    })
  })

  return result
}
