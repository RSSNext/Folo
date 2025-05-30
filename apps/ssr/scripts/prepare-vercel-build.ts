import { mkdirSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"

mkdirSync(path.join(__dirname, "../.generated"), { recursive: true })

async function generateIndexHtmlData() {
  const indexHtml = await fs.readFile(path.join(__dirname, "../dist/index.html"), "utf-8")
  await fs.writeFile(
    path.join(__dirname, "../.generated/index.template.ts"),
    `export default ${JSON.stringify(indexHtml)}`,
  )
}

async function replaceEnvFile() {
  const envFile = await fs.readFile(path.join(__dirname, "../src/lib/env.ts"), "utf-8")

  await fs.writeFile(
    path.join(__dirname, "../src/lib/env.ts"),
    // For tree shaking
    envFile.replace(
      `export const isDev = process.env.NODE_ENV === "development"`,
      `export const isDev = ${process.env.NODE_ENV === "development"}`,
    ),
  )
}

async function main() {
  await Promise.all([generateIndexHtmlData(), replaceEnvFile()])
}

main()
