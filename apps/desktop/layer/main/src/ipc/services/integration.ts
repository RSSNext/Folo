import { existsSync } from "node:fs"
import fsp from "node:fs/promises"

import path from "pathe"

import { store } from "~/lib/store"

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
}
