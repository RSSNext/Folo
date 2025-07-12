import { existsSync } from "node:fs"
import fsp from "node:fs/promises"

import path from "pathe"

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
}
