import { fileURLToPath } from "node:url"

import { dirname } from "pathe"

import { applyReleaseConfig } from "./apply-release-config.impl"

const projectDir = dirname(dirname(fileURLToPath(import.meta.url)))

async function main() {
  await applyReleaseConfig({
    projectDir,
    version: process.argv[2] ?? "",
  })
}

void main()
