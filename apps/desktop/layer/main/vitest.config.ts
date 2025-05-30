import { fileURLToPath } from "node:url"

import tsconfigPath from "vite-tsconfig-paths"
import { defineProject } from "vitest/config"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

export default defineProject({
  root: "./",
  test: {
    globals: true,
    environment: "node",
  },

  plugins: [
    tsconfigPath({
      projects: ["./tsconfig.json"],
    }),
  ],
})
