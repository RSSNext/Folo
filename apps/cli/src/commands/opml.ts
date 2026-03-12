import { mkdir, readFile, writeFile } from "node:fs/promises"

import type { Command } from "commander"
import { basename, dirname } from "pathe"

import { runCommand } from "../command"

interface OpmlExportOptions {
  output?: string
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
    .option("--output <file>", "Write exported OPML to file")
    .action(async function (this: Command, options: OpmlExportOptions) {
      await runCommand(this, async ({ client }) => {
        const response = await client.api.subscriptions.export({
          format: "opml",
        })

        if (!options.output) {
          return response
        }

        await mkdir(dirname(options.output), { recursive: true })
        await writeFile(options.output, response.content, "utf8")

        return {
          output: options.output,
          filename: response.filename,
          contentType: response.contentType,
          bytes: Buffer.byteLength(response.content),
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
