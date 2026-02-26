import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  clean: true,
  sourcemap: false,
  dts: false,
  splitting: false,
  shims: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
})
