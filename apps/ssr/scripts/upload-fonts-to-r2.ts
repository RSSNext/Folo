import { execSync } from "node:child_process"
import fs from "node:fs"
import { createRequire } from "node:module"

import path, { resolve } from "pathe"

const require = createRequire(import.meta.url)

const BUCKET = "follow"
const PREFIX = "ssr-fonts"
const ACCOUNT_ID = "1f1d1678a2413a54c944b3081bab5c84"

const snFontDepsPath = require.resolve("@fontsource/sn-pro")
const snFontsDirPath = resolve(snFontDepsPath, "../files")
const snFontsDir = fs
  .readdirSync(snFontsDirPath)
  .filter((name) => !name.endsWith(".woff2") && !name.includes("italic"))

for (const file of snFontsDir) {
  const filePath = path.join(snFontsDirPath, file)
  const key = `${PREFIX}/${file}`
  console.info(`Uploading ${file}...`)
  execSync(
    `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler r2 object put ${BUCKET}/${key} --file "${filePath}" --remote`,
    { stdio: "inherit" },
  )
}

const koseFontPath = require.resolve("kose-font")
console.info("Uploading kose-font.ttf...")
execSync(
  `CLOUDFLARE_ACCOUNT_ID=${ACCOUNT_ID} npx wrangler r2 object put ${BUCKET}/${PREFIX}/kose-font.ttf --file "${koseFontPath}" --remote`,
  { stdio: "inherit" },
)

console.info("All fonts uploaded successfully!")
