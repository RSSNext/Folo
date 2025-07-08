import fs from "node:fs"

import path from "pathe"
import type { Plugin } from "vite"

export default function manifestPlugin(): Plugin {
  let config

  return {
    name: "manifest",
    enforce: "post",
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    generateBundle(_options, bundle) {
      const outputDir = config.build.outDir
      const assetsDir = path.join(outputDir, "assets")
      const outputPath = path.join(assetsDir, "manifest.txt")

      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true })
      }

      const fileStream = fs.createWriteStream(outputPath)

      for (const fileName in bundle) {
        fileStream.write(`${fileName}\n`)
      }

      fileStream.end()
    },
  }
}
