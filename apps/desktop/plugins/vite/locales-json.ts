import path from "node:path"
import { fileURLToPath } from "node:url"

import { set } from "es-toolkit/compat"
import type { Plugin } from "vite"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const localesDir = path.resolve(__dirname, "../../../../locales")

export function localesJsonPlugin(): Plugin {
  let isBuild = false
  return {
    name: "locales-json-transform",
    enforce: "pre",
    configResolved(config) {
      isBuild = config.command === "build"
    },
    async transform(code, id) {
      if (isBuild) {
        return null
      }
      if (!id.includes(localesDir) || !id.endsWith(".json")) {
        return null
      }

      const content = JSON.parse(code)
      const obj = {}

      const keys = Object.keys(content as object)
      for (const accessorKey of keys) {
        set(obj, accessorKey, (content as any)[accessorKey])
      }

      console.info("[locales-json-transform] Transformed:", id)
      return {
        code: JSON.stringify(obj),
        map: null,
      }
    },
  }
}
