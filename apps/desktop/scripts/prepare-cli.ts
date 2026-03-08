import { execSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync } from "node:fs"

import { resolve } from "pathe"

const rootDir = resolve(import.meta.dirname, "../../..")
const cliDistDir = resolve(rootDir, "apps/cli/dist")
const targetDir = resolve(rootDir, "apps/desktop/resources/cli")

// Build CLI
console.info("Building CLI...")
execSync("pnpm --filter @follow/cli build", {
  cwd: rootDir,
  stdio: "inherit",
})

// Ensure CLI was built
const cliEntry = resolve(cliDistDir, "index.js")
if (!existsSync(cliEntry)) {
  throw new Error(`CLI build output not found at ${cliEntry}`)
}

// Copy to desktop resources
mkdirSync(targetDir, { recursive: true })
cpSync(cliEntry, resolve(targetDir, "index.js"))

console.info("CLI prepared at", targetDir)
