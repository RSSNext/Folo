import { createReadStream, createWriteStream, readdirSync, renameSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"

import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["./index.ts"],
  outDir: "dist/server",

  clean: true,
  format: ["esm"],
  external: ["lightningcss", "vite"],
  treeshake: true,

  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
  },

  hooks(hooks) {
    hooks.hook("build:done", async () => {
      if (process.env.VERCEL !== "1") return

      const outputFile = "dist/server/index.js"
      const tempFile = `${outputFile}.tmp`

      try {
        const insertCode = `try {
const noop = () => {}
import("@fontsource/sn-pro").then(noop)
import('kose-font').then(noop)
import('kose-font/fonts/KosefontP-JP.ttf').then(noop)
import('kose-font/fonts/Kosefont-JP.ttf').then(noop)
${(() => {
  const require = createRequire(import.meta.url)
  const fontDepsPath = require.resolve("@fontsource/sn-pro")
  const fontsDirPath = resolve(fontDepsPath, "../files")
  return readdirSync(fontsDirPath)
    .map((file) => `require.resolve("@fontsource/sn-pro/files/${file}")`)
    .join("\n")
})()}
} catch {}
      `

        const writeStream = createWriteStream(tempFile)

        if (insertCode) {
          writeStream.write(insertCode)
        }

        const readStream = createReadStream(outputFile)

        await new Promise<void>((resolve, reject) => {
          readStream.pipe(writeStream)
          writeStream.on("finish", () => resolve())
          writeStream.on("error", reject)
          readStream.on("error", reject)
        })

        renameSync(tempFile, outputFile)

        console.info("Successfully inserted font dependencies into", outputFile)
      } catch (error) {
        console.error("Failed to modify output file:", error)
      }
    })
  },
})
