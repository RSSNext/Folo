import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  splitting: false,
  dts: true,
  clean: true,
  format: ["cjs", "esm"],
  treeshake: true,
})
