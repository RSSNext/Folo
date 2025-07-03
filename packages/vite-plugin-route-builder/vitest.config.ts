import tsconfigPath from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/__tests__/", "dist/", "*.config.*", "**/*.d.ts"],
    },
  },
  plugins: [
    tsconfigPath({
      projects: ["./tsconfig.json"],
    }),
  ],
})
