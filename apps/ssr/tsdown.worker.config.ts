import { dirname } from "pathe"
import { defineConfig } from "tsdown"

const __dirname = dirname(import.meta.url.replace("file://", ""))

export default defineConfig({
  entry: ["./worker-entry.ts"],
  outDir: "dist/worker",

  clean: true,
  format: ["esm"],
  external: ["node:*", /\.wasm$/],
  noExternal: ["**"],
  treeshake: true,
  splitting: false,

  alias: {
    "./src/lib/og/render-to-image": "./src/lib/og/render-to-image.worker",
    "./src/lib/og/fonts": "./src/lib/og/fonts.worker",
    "../../lib/og/render-to-image": "../../lib/og/render-to-image.worker",
    "./src/lib/load-env": "./src/lib/load-env.worker",
    "@fastify/request-context": path.resolve(__dirname, "src/lib/worker-request-context.ts"),
  },

  define: {
    __DEV__: JSON.stringify(false),
  },
})
