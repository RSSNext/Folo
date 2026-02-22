import fs from "node:fs"

import { dirname, join } from "pathe"

const distDir = join(dirname(import.meta.url.replace("file://", "")), "../dist/worker")

const files = fs.readdirSync(distDir).filter((f) => f.endsWith(".mjs"))

for (const file of files) {
  const filePath = join(distDir, file)
  const code = fs.readFileSync(filePath, "utf-8")

  // Fix createRequire(import.meta.url) - import.meta.url is undefined in Cloudflare Workers
  // Provide a fallback URL so createRequire can initialize properly
  const patched = code.replaceAll(
    "createRequire(import.meta.url)",
    'createRequire(import.meta.url || "file:///worker.mjs")',
  )

  if (patched !== code) {
    fs.writeFileSync(filePath, patched)
    console.info(`Patched createRequire in ${file}`)
  }
}
