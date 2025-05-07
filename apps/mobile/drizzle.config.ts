import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./src/database/schemas/index.ts",
  out: "./drizzle",
})
