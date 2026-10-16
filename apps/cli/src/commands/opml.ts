import { mkdir, readFile, stat, writeFile } from "node:fs/promises"

import type { FollowClient } from "@follow-app/client-sdk"
import type { Command } from "commander"
import { basename, dirname, join } from "pathe"

import { runCommand } from "../command"

interface OpmlExportOptions {
  output?: string
}

/** The file name of an export when the CLI picks it */
export const OPML_FILENAME = "folo.opml"

/**
 * GET /subscriptions/export answers with the OPML document itself (application/xml), not the
 * JSON object the SDK types it as, so it is read as text.
 */
export const fetchOPMLExport = async (client: FollowClient) => {
  const response = await client.request<Response>("/subscriptions/export", { asRaw: true })
  return {
    content: await response.text(),
    contentType: response.headers.get("content-type") ?? "application/xml",
  }
}

/** A directory, or a path that ends like one, gets the export as folo.opml inside it */
export const resolveOPMLOutputPath = async (output: string) => {
  if (/[/\\]$/.test(output)) {
    return join(output, OPML_FILENAME)
  }
  const stats = await stat(output).catch(() => null)
  return stats?.isDirectory() ? join(output, OPML_FILENAME) : output
}

interface OpmlImportOptions {
  items?: string
}

const parseItems = (value?: string): string[] => {
  if (!value) {
    return []
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export const registerOPMLCommand = (program: Command) => {
  const opmlCommand = program.command("opml").description("Import and export OPML")

  opmlCommand
    .command("export")
    .description("Export subscriptions as OPML")
    .option("--output <file>", `Write exported OPML to file (${OPML_FILENAME} in a directory)`)
    .action(async function (this: Command, options: OpmlExportOptions) {
      await runCommand(this, async ({ client, options: globalOptions }) => {
        const { content, contentType } = await fetchOPMLExport(client)

        if (!options.output) {
          // Plain output is the document itself, ready to be redirected into a file
          if (globalOptions.format === "plain") {
            return content
          }
          return { filename: OPML_FILENAME, contentType, content }
        }

        const output = await resolveOPMLOutputPath(options.output)
        await mkdir(dirname(output), { recursive: true })
        await writeFile(output, content, "utf8")

        return {
          output,
          filename: basename(output),
          contentType,
          bytes: Buffer.byteLength(content),
        }
      })
    })

  opmlCommand
    .command("import")
    .description("Import subscriptions from OPML file")
    .argument("<file>", "Path to OPML or XML file")
    .option("--items <urls>", "Comma-separated feed URLs to import from parsed file")
    .action(async function (this: Command, filePath: string, options: OpmlImportOptions) {
      await runCommand(this, async ({ client }) => {
        const fileBuffer = await readFile(filePath)
        const fileName = basename(filePath)
        const formData = new FormData()

        formData.append(
          "file",
          new Blob([fileBuffer], {
            type: "application/octet-stream",
          }),
          fileName,
        )

        const items = parseItems(options.items)
        if (items.length > 0) {
          formData.append("items", JSON.stringify(items))
        }

        const response = await client.api.subscriptions.import(formData)
        return response.data
      })
    })
}
