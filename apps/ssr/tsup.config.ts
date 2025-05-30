import fs from "node:fs"
import { createRequire } from "node:module"
import path, { resolve } from "node:path"

import { defineConfig } from "tsup"

export default defineConfig(() => {
  return {
    entry: ["index.ts"],
    outDir: "dist/server",
    splitting: false,
    clean: true,
    format: ["cjs"],
    external: ["lightningcss"],
    treeshake: true,
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    },
    banner: {
      // A trick to get vercel to recognize fonts as such and then keep the node_modules
      js:
        process.env.VERCEL === "1"
          ? `
      try {
      require.resolve("@fontsource/sn-pro")
      require.resolve('kose-font')
      require.resolve('kose-font/fonts/KosefontP-JP.ttf')
      require.resolve('kose-font/fonts/Kosefont-JP.ttf')
      ${(() => {
        const require = createRequire(import.meta.url)
        const fontDepsPath = require.resolve("@fontsource/sn-pro")
        const fontsDirPath = resolve(fontDepsPath, "../files")
        return fs
          .readdirSync(path.join(fontsDirPath))
          .map((file) => `require.resolve("@fontsource/sn-pro/files/${file}")`)
          .join("\n")
      })()}
      } catch {}
      `
          : ``,
    },
  }
})
