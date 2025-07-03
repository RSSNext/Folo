import { mkdirSync } from "node:fs"
import fs from "node:fs/promises"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

mkdirSync(path.join(__dirname, "../.generated"), { recursive: true })

async function generateIndexHtmlData() {
  const indexHtml = await fs.readFile(path.join(__dirname, "../dist/index.html"), "utf-8")
  await fs.writeFile(
    path.join(__dirname, "../.generated/index.template.ts"),
    `export default ${JSON.stringify(indexHtml)}`,
  )
}

async function main() {
  await generateIndexHtmlData()
}

main()
