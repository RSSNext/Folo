import fs from "node:fs"
import { createRequire } from "node:module"

import path, { resolve } from "pathe"

const require = createRequire(import.meta.url)

const snPath = require.resolve("@fontsource/sn-pro")
const filesDir = resolve(snPath, "../files")
const files = fs.readdirSync(filesDir).filter((f) => !f.endsWith(".woff2") && !f.includes("italic"))
files.forEach((f) => {
  const stat = fs.statSync(path.join(filesDir, f))
  console.info(f, `${(stat.size / 1024).toFixed(1)}KB`)
})
const kosePath = require.resolve("kose-font")
const koseSize = fs.statSync(kosePath).size
console.info(`kose-font: ${(koseSize / 1024).toFixed(1)}KB`)
let total = files.reduce((sum, f) => sum + fs.statSync(path.join(filesDir, f)).size, 0)
total += koseSize
console.info(`Total: ${(total / 1024 / 1024).toFixed(1)}MB`)
