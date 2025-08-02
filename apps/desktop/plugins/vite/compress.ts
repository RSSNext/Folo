import { execSync } from "node:child_process"
import { createHash } from "node:crypto"
import fs from "node:fs/promises"

import path from "pathe"
import * as tar from "tar"
import type { Plugin } from "vite"

import { calculateMainHash } from "./generate-main-hash"

async function compressDirectory(sourceDir: string, outputFile: string) {
  await tar.c(
    {
      gzip: true,
      file: outputFile,
      cwd: sourceDir,
    },
    ["renderer"],
  )
}

function compressAndFingerprintPlugin(outDir: string): Plugin {
  return {
    name: "compress-and-fingerprint",
    apply: "build",
    async closeBundle() {
      const outputFile = path.join(outDir, "render-asset.tar.gz")
      const manifestFile = path.join(outDir, "manifest.yml")

      console.info("Compressing and fingerprinting...")
      // Compress the entire output directory
      await compressDirectory(outDir, outputFile)
      console.info("Compressing and fingerprinting", outDir, "done")

      // Calculate the file hash
      const fileBuffer = await fs.readFile(outputFile)
      const hashSum = createHash("sha256")
      hashSum.update(fileBuffer)
      const hex = hashSum.digest("hex")

      // Calculate main hash
      const mainHash = await calculateMainHash(path.resolve(process.cwd(), "layer/main"))

      // Get the current git tag version
      let version = "unknown"
      try {
        version = execSync("git describe --tags").toString().trim().replace("desktop/", "")
      } catch (error) {
        console.warn("Could not retrieve git tag version:", error)
      }

      // Write the manifest file
      const manifestContent = `
version: ${version.startsWith("v") ? version.slice(1) : version}
hash: ${hex}
mainHash: ${mainHash}
commit: ${execSync("git rev-parse HEAD").toString().trim()}
filename: ${path.basename(outputFile)}
`
      console.info("Writing manifest file", manifestContent)
      await fs.writeFile(manifestFile, manifestContent.trim())
    },
  }
}

export default compressAndFingerprintPlugin
