#!/usr/bin/env node

import { execSync } from "node:child_process"
import { fileURLToPath } from "node:url"

import { dirname, join } from "pathe"

const __dirname = dirname(fileURLToPath(import.meta.url))
const indexPath = join(__dirname, "..", "index.ts")

try {
  execSync(`tsx "${indexPath}"`, {
    stdio: "inherit",
    cwd: process.cwd(),
  })
} catch (error) {
  process.exit(error.status || 1)
}
