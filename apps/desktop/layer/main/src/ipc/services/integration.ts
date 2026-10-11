import { existsSync } from "node:fs"
import fsp from "node:fs/promises"

import { dialog, net, shell } from "electron"
import { IpcMethod, IpcService } from "electron-ipc-decorator"
import path from "pathe"

import { t } from "~/lib/i18n"
import { store } from "~/lib/store"
import { logger } from "~/logger"

import { createObsidianFrontmatter } from "./obsidian-frontmatter"

// Taken from https://github.com/rollup/rollup/blob/4f69d33af3b2ec9320c43c9e6c65ea23a02bdde3/src/utils/sanitizeFileName.ts
// https://datatracker.ietf.org/doc/html/rfc2396
// eslint-disable-next-line no-control-regex
const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$%&*+,:;<=>?[\]^`{|}\u007F/\\]/g

// The name is an entry title, not a path, so no `:` is kept, not even after a leading letter
// that looks like a drive: on Windows it would write to an NTFS alternate data stream
function sanitizeFileName(name: string): string {
  return name.replaceAll(INVALID_CHAR_REGEX, "_")
}

// Input types
interface SaveToEagleInput {
  url: string
  mediaUrls: string[]
}

interface SetEagleContextMenuEnabledInput {
  enabled: boolean
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

export async function saveMediaToEagle(input: SaveToEagleInput): Promise<any> {
  try {
    const res = await net.fetch("http://localhost:41595/api/item/addFromURLs", {
      method: "POST",
      credentials: "omit",
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

const BUILT_IN_URL_SCHEME_PROTOCOLS = new Set<string>([
  "http",
  "https",
  "mailto",
  "obsidian",
  "bear",
  "drafts",
  "things",
  "notion",
  "x-devonthink",
])

// Protocols that must never be handed to `shell.openExternal`, even after user
// confirmation. Matches are exact so custom protocols such as `file-helper`
// remain usable.
const DISALLOWED_URL_SCHEME_PROTOCOLS = new Set<string>([
  "data",
  "file",
  "jar",
  "javascript",
  "ms-msdt",
  "res",
  "search-ms",
  "smb",
  "vbscript",
])

function isDisallowedURLSchemeProtocol(protocol: string): boolean {
  return DISALLOWED_URL_SCHEME_PROTOCOLS.has(protocol)
}

async function confirmUserDefinedURLScheme(protocol: string): Promise<boolean> {
  const result = await dialog.showMessageBox({
    type: "warning",
    title: t("dialog.openExternalApp.title"),
    message: t("dialog.openExternalApp.message", {
      url: `${protocol}://`,
      interpolation: { escapeValue: false },
    }),
    buttons: [t("dialog.open"), t("dialog.cancel")],
    defaultId: 1,
    cancelId: 1,
  })

  return result.response === 0
}

export class IntegrationService extends IpcService {
  static override readonly groupName = "integration"

  @IpcMethod()
  async saveToObsidian(input: {
    url: string
    title: string
    content: string
    author: string
    publishedAt: string
    vaultPath: string
    description?: string
    feedTitle?: string
    feedUrl?: string
  }) {
    try {
      const {
        url,
        title,
        content,
        author,
        publishedAt,
        vaultPath,
        description,
        feedTitle,
        feedUrl,
      } = input

      const fileName = `${sanitizeFileName(title || publishedAt)
        .trim()
        .slice(0, 80)}.md`
      const filePath = path.join(vaultPath, fileName)
      const exists = existsSync(filePath)
      if (exists) {
        return { success: false, error: "File already exists" }
      }

      await fsp.mkdir(path.dirname(filePath), { recursive: true })

      const frontmatter = createObsidianFrontmatter({
        url,
        author,
        publishedAt,
        description,
        tags: ["folo"],
        feedTitle,
        feedUrl,
      })

      const markdown = `${frontmatter}

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
  async saveToEagle(input: SaveToEagleInput): Promise<any> {
    return saveMediaToEagle(input)
  }

  @IpcMethod()
  setEagleContextMenuEnabled(input: SetEagleContextMenuEnabledInput): void {
    store.set("eagleContextMenuEnabled", input.enabled)
  }

  @IpcMethod()
  async loginToQBittorrent(input: LoginToQBittorrentInput) {
    const { host, username, password } = input

    const existingSID = store.get("qbittorrentSID")
    if (existingSID) {
      const errorMessage = await this.checkQBittorrentAuth({ host })
      if (!errorMessage) {
        return
      }
    }

    const res = await net.fetch(`${host}/api/v2/auth/login`, {
      method: "POST",
      // The session id is read from `set-cookie` and kept by the app; Chromium must not keep it too.
      credentials: "omit",
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

  async checkQBittorrentAuth(input: CheckQBittorrentAuthInput) {
    const { host } = input
    const sid = store.get("qbittorrentSID")
    if (!sid) {
      return "Not logged in to qBittorrent"
    }
    const res = await net.fetch(`${host}/api/v2/auth/check`, {
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
  async addMagnet(input: AddMagnetInput) {
    const { host, urls } = input
    const sid = store.get("qbittorrentSID")
    if (!sid) {
      return "Not logged in to qBittorrent"
    }
    const res = await net.fetch(`${host}/api/v2/torrents/add`, {
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

    console.log(`Added magnet links to qBittorrent: ${urls.join(", ")}`)
  }

  @IpcMethod()
  async customFetch(input: CustomFetchInput) {
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

    // Only the header names are logged: the log file is written at every level and users attach
    // it to issues, while integrations carry secrets in cookies, custom headers and bodies
    logger.debug(`[CustomFetch:${requestId}] Request headers`, {
      names: Object.keys(headers || {}),
    })

    const startTime = Date.now()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        logger.warn(`[CustomFetch:${requestId}] Request timeout triggered after ${timeout}ms`)
        controller.abort()
      }, timeout)

      logger.debug(`[CustomFetch:${requestId}] Sending request...`)

      const response = await net.fetch(url, {
        method,
        headers,
        credentials: "omit",
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
        contentType: responseHeaders["content-type"],
        contentLength: responseHeaders["content-length"],
      })

      // Get response text
      const text = await response.text()
      const responseSize = text.length

      logger.debug(`[CustomFetch:${requestId}] Response body received`, {
        size: `${responseSize} chars`,
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
  async openURLScheme(scheme: string) {
    const requestId = Math.random().toString(36).slice(2, 8)

    try {
      // Parse and validate the protocol up-front. `shell.openExternal` will
      // happily dispatch any scheme the OS has registered a handler for. Keep
      // known dangerous protocols blocked while allowing user-configured app
      // schemes such as `logseq://` or `ulysses://`.
      let protocol: string
      try {
        protocol = new URL(scheme).protocol.replace(/:$/, "").toLowerCase()
      } catch {
        throw new Error("Invalid URL scheme format. Must include protocol (e.g., 'app://')")
      }

      if (!protocol) {
        throw new Error("Invalid URL scheme format. Must include protocol (e.g., 'app://')")
      }

      if (isDisallowedURLSchemeProtocol(protocol)) {
        throw new Error(`URL scheme "${protocol}://" is not allowed.`)
      }

      if (
        !BUILT_IN_URL_SCHEME_PROTOCOLS.has(protocol) &&
        !(await confirmUserDefinedURLScheme(protocol))
      ) {
        throw new Error(`URL scheme "${protocol}://" was not opened.`)
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
        protocol,
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
