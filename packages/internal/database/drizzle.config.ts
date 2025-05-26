import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "sqlite",
  driver: "expo",
  schema: "./src/schemas/index.ts",
  out: "./src/drizzle",
})
