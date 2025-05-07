import fs from "node:fs"
import path from "node:path"

import type { Plugin, ResolvedConfig } from "vite"

export function cleanupUnnecessaryFilesPlugin(files: string[]): Plugin {
  let config: ResolvedConfig
  return {
    name: "cleanup-unnecessary",
    enforce: "post",
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    async generateBundle(_options) {
      await Promise.all(
        files.map((file) => {
          console.info(`Deleting ${path.join(config.build.outDir, file)}`)
          return fs.promises.unlink(path.join(config.build.outDir, file))
        }),
      )
    },
  }
}
