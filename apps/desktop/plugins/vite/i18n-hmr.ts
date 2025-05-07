import { readFileSync } from "node:fs"

import type { Plugin } from "vite"

export function customI18nHmrPlugin(): Plugin {
  return {
    name: "custom-i18n-hmr",
    handleHotUpdate({ file, server }) {
      if (file.endsWith(".json") && file.includes("locales")) {
        server.ws.send({
          type: "custom",
          event: "i18n-update",
          data: {
            file,
            content: readFileSync(file, "utf-8"),
          },
        })

        // return empty array to prevent the default HMR
        return []
      }
    },
  }
}
