import { existsSync } from "node:fs"
import fsp from "node:fs/promises"

import { shell } from "electron"
import path from "pathe"

import { store } from "~/lib/store"
import { logger } from "~/logger"

import type { IpcContext } from "../base"
import { IpcMethod, IpcService } from "../base"

// Taken from https://github.com/rollup/rollup/blob/4f69d33af3b2ec9320c43c9e6c65ea23a02bdde3/src/utils/sanitizeFileName.ts
// https://datatracker.ietf.org/doc/html/rfc2396
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F]/g
const DRIVE_LETTER_REGEX = /^[a-z]:/i

function sanitizeFileName(name: string): string {
  const match = DRIVE_LETTER_REGEX.exec(name)
  const driveLetter = match ? match[0] : ""

  // A `:` is only allowed as part of a windows drive letter (ex: C:\foo)
  // Otherwise, avoid them because they can refer to NTFS alternate data streams.
  return driveLetter + name.slice(driveLetter.length).replaceAll(INVALID_CHAR_REGEX, "_")
}

// Input types
interface SaveToEagleInput {
  url: string
  mediaUrls: string[]
}

interface LoginToQBittorrentInput {
  host: string
  username: string
  password: string
}

interface CheckQBittorrentAuthInput {
  host: string
}

interface AddMagnetInput {
  host: string
  urls: string[]
}

interface CustomFetchInput {
  url: string
  method: string
  headers: Record<string, string>
  body?: string
  timeout?: number
}

export class IntegrationService extends IpcService {
  constructor() {
    super("integration")
  }

  @IpcMethod()
  async saveToObsidian(
    context: IpcContext,
    input: {
      url: string
      title: string
      content: string
      author: string
      publishedAt: string
      vaultPath: string
    },
  ) {
    try {
      const { url, title, content, author, publishedAt, vaultPath } = input

      const fileName = `${sanitizeFileName(title || publishedAt)
        .trim()
        .slice(0, 20)}.md`
      const filePath = path.join(vaultPath, fileName)
      const exists = existsSync(filePath)
      if (exists) {
        return { success: false, error: "File already exists" }
      }

      const markdown = `---
url: ${url}
author: ${author}
publishedAt: ${publishedAt}
---

# ${title}

${content}
`

      await fsp.writeFile(filePath, markdown, "utf-8")
      return { success: true }
    } catch (error) {
      console.error("Failed to save to Obsidian:", error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return { success: false, error: errorMessage }
    }
  }

  @IpcMethod()
  async saveToEagle(context: IpcContext, input: SaveToEagleInput): Promise<any> {
    try {
      const res = await fetch("http://localhost:41595/api/item/addFromURLs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: input.mediaUrls?.map((media) => ({
            url: media,
            website: input.url,
            headers: {
              referer: input.url,
            },
          })),
        }),
      })
      return await res.json()
    } catch {
      return null
    }
  }

  @IpcMethod()
  async loginToQBittorrent(context: IpcContext, input: LoginToQBittorrentInput) {
    const { host, username, password } = input

    const existingSID = store.get("qbittorrentSID")
    if (existingSID) {
      const errorMessage = await this.checkQBittorrentAuth(context, { host })
      if (!errorMessage) {
        return
      }
    }

    const res = await fetch(`${host}/api/v2/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
    })

    if (!res.ok) {
      return `Failed to log in to qBittorrent: ${await res.text()}`
    }

    const cookies = res.headers.get("set-cookie") || ""
    const match = cookies.match(/SID=([^;]+)/)
    if (!match || !match[1]) {
      return "Failed to get SID from qBittorrent"
    }

    store.set("qbittorrentSID", match[1])
    return
  }

  async checkQBittorrentAuth(context: IpcContext, input: CheckQBittorrentAuthInput) {
    const { host } = input
    const sid = store.get("qbittorrentSID")
    if (!sid) {
      return "Not logged in to qBittorrent"
    }
    const res = await fetch(`${host}/api/v2/auth/check`, {
      method: "GET",
      headers: {
        Cookie: `SID=${sid}`,
      },
      credentials: "omit",
    })

    if (!res.ok) {
      return await res.text()
    }
  }

  @IpcMethod()
  async addMagnet(context: IpcContext, input: AddMagnetInput) {
    const { host, urls } = input
    const sid = store.get("qbittorrentSID")
    if (!sid) {
      return "Not logged in to qBittorrent"
    }
    const res = await fetch(`${host}/api/v2/torrents/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: `SID=${sid}`,
      },
      credentials: "omit",
      body: `urls=${encodeURIComponent(urls.join("\n"))}`,
    })

    if (!res.ok) {
      const text = await res.text()
      return `Failed to add magnet links: ${text}`
    }

    // eslint-disable-next-line no-console
    console.log(`Added magnet links to qBittorrent: ${urls.join(", ")}`)
  }

  @IpcMethod()
  async customFetch(context: IpcContext, input: CustomFetchInput) {
    const requestId = Math.random().toString(36).slice(2, 8)
    const { url, method, headers, body, timeout = 10_000 } = input

    // Log request start
    logger.info(`[CustomFetch:${requestId}] Starting request`, {
      url: url.replaceAll(/(\?|&)([^=]+)=([^&]+)/g, (_, prefix, key, value) =>
        // Mask potential sensitive query parameters
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("password")
          ? `${prefix}${key}=***`
          : `${prefix}${key}=${value}`,
      ),
      method,
      timeout,
      hasBody: !!body,
      bodyLength: body?.length || 0,
      headerCount: Object.keys(headers || {}).length,
    })

    // Log request headers (mask sensitive headers)
    const safeHeaders = { ...headers }
    Object.keys(safeHeaders).forEach((key) => {
      if (
        key.toLowerCase().includes("authorization") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("key")
      ) {
        safeHeaders[key] = "***"
      }
    })
    logger.debug(`[CustomFetch:${requestId}] Request headers`, { headers: safeHeaders })

    // Log request body (truncated for large bodies)
    if (body) {
      const truncatedBody =
        body.length > 500
          ? `${body.slice(0, 500)}... [truncated, total: ${body.length} chars]`
          : body
      logger.debug(`[CustomFetch:${requestId}] Request body`, { body: truncatedBody })
    }

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        logger.warn(`[CustomFetch:${requestId}] Request timeout triggered after ${timeout}ms`)
        controller.abort()
      }, timeout)

      logger.debug(`[CustomFetch:${requestId}] Sending request...`)

      const response = await fetch(url, {
        method,
        headers,
        body: body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) ? body : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      // Log response info
      logger.info(`[CustomFetch:${requestId}] Request completed`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration: `${duration}ms`,
      })

      // Convert response headers to plain object
      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      logger.debug(`[CustomFetch:${requestId}] Response headers`, {
        headers: responseHeaders,
        contentType: responseHeaders["content-type"],
        contentLength: responseHeaders["content-length"],
      })

      // Get response text
      const text = await response.text()
      const responseSize = text.length

      logger.debug(`[CustomFetch:${requestId}] Response body received`, {
        size: `${responseSize} chars`,
        preview: text.length > 200 ? `${text.slice(0, 200)}...` : text,
      })

      // Try to parse as JSON, fallback to text
      let data: any
      try {
        data = JSON.parse(text)
        logger.debug(`[CustomFetch:${requestId}] Response successfully parsed as JSON`)
      } catch {
        data = text
        logger.debug(`[CustomFetch:${requestId}] Response kept as text (not valid JSON)`)
      }

      const result = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        text,
      }

      logger.info(`[CustomFetch:${requestId}] Request successful`, {
        finalStatus: result.ok ? "success" : "http_error",
        responseSize: `${responseSize} chars`,
        totalDuration: `${Date.now() - startTime}ms`,
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      if (error instanceof Error && error.name === "AbortError") {
        logger.error(`[CustomFetch:${requestId}] Request timeout`, {
          duration: `${duration}ms`,
          timeout: `${timeout}ms`,
          url: url.split("?")[0], // Remove query params for privacy
        })
        throw new Error(`Request timeout after ${timeout}ms`)
      }

      logger.error(`[CustomFetch:${requestId}] Request failed`, {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : "Unknown",
        duration: `${duration}ms`,
        url: url.split("?")[0], // Remove query params for privacy
      })

      throw error
    }
  }

  @IpcMethod()
  async openURLScheme(context: IpcContext, scheme: string) {
    const requestId = Math.random().toString(36).slice(2, 8)

    try {
      // Validate URL scheme format
      if (!scheme.includes("://")) {
        throw new Error("Invalid URL scheme format. Must include protocol (e.g., 'app://')")
      }

      // Log URL scheme execution (mask sensitive data)
      const safeScheme = scheme.replaceAll(/(\?|&)([^=]+)=([^&]+)/g, (_, prefix, key, value) =>
        // Mask potential sensitive query parameters
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("password")
          ? `${prefix}${key}=***`
          : `${prefix}${key}=${value}`,
      )

      logger.info(`[URLScheme:${requestId}] Opening URL scheme`, {
        scheme: safeScheme,
        protocol: scheme.split("://")[0],
      })

      // Use Electron's shell.openExternal to open URL scheme
      // This will trigger the system's default handler for the scheme
      await shell.openExternal(scheme)

      logger.info(`[URLScheme:${requestId}] URL scheme opened successfully`)

      return { success: true }
    } catch (error) {
      logger.error(`[URLScheme:${requestId}] Failed to open URL scheme`, {
        error: error instanceof Error ? error.message : String(error),
        scheme: scheme.split("://")[0], // Only log protocol for privacy
      })

      throw error
    }
  }
}
