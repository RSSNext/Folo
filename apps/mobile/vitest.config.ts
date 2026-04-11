import { defineConfig } from "vitest/config"

export default defineConfig({
  root: import.meta.dirname,
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.spec.ts",
      "scripts/**/*.test.ts",
      "../../.github/scripts/**/*.test.ts",
    ],
  },
})
