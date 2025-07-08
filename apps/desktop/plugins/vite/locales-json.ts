import { fileURLToPath } from "node:url"

import { set } from "es-toolkit/compat"
import path from "pathe"
import type { Logger, Plugin } from "vite"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const localesDir = path.resolve(__dirname, "../../../../locales")

export function localesJsonPlugin(): Plugin {
  let logger: Logger
  return {
    name: "locales-json-transform",
    enforce: "pre",
    configResolved(config) {
      logger = config.logger
    },
    async transform(code, id) {
      if (!id.includes(localesDir) || !id.endsWith(".json")) {
        return null
      }

      const content = JSON.parse(code)
      const obj = {}

      const keys = Object.keys(content as object)
      for (const accessorKey of keys) {
        set(obj, accessorKey, (content as any)[accessorKey])
      }

      logger.info(`[locales-json-transform] Transformed: ${id}`)
      return {
        code: JSON.stringify(obj),
        map: null,
      }
    },
  }
}
