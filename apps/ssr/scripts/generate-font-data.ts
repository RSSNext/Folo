import fs from "node:fs"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

import path, { dirname, resolve } from "pathe"

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

const weights = [
  { name: "Thin", weight: 100 },
  { name: "ExtraLight", weight: 200 },
  { name: "Light", weight: 300 },
  { name: "Regular", weight: 400 },
  { name: "Italic", weight: 400 },
  { name: "Medium", weight: 500 },
  { name: "SemiBold", weight: 600 },
  { name: "Bold", weight: 700 },
  { name: "ExtraBold", weight: 800 },
  { name: "Black", weight: 900 },
] as const

const snFontDepsPath = require.resolve("@fontsource/sn-pro")
const snFontsDirPath = resolve(snFontDepsPath, "../files")
const snFontsDir = fs
  .readdirSync(snFontsDirPath)
  .filter((name) => !name.endsWith(".woff2") && !name.includes("italic"))

const fontsData: Record<string, string> = {}

for (const file of snFontsDir) {
  const weight = weights.find((w) => file.includes(w.weight.toString()))
  if (!weight) continue
  const data = fs.readFileSync(path.join(snFontsDirPath, file))
  fontsData[`sn-pro-${weight.weight}`] = data.toString("base64")
}

// kose-font is too large (~24MB) to bundle, loaded from R2 at runtime instead

const outDir = path.join(__dirname, "../.generated")
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  path.join(outDir, "fonts-data.ts"),
  `export default ${JSON.stringify(fontsData)} as Record<string, string>`,
)
console.info("Generated fonts-data.ts with", Object.keys(fontsData).length, "fonts")
