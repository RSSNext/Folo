import { defineWranglerConfig } from "wrangler/experimental-config"

// Build settings for the Wrangler bundler that `cf build` runs. The Worker keeps its hand-written
// Env type, so `cf dev` does not write worker-configuration.d.ts; run `cf workers types` for the
// generated binding types.
export default defineWranglerConfig({
  rules: [
    {
      type: "CompiledWasm",
      globs: ["**/*.wasm"],
      fallthrough: true,
    },
  ],
  assetsDirectory: "../desktop/out/web",
  // Wrangler deploys did not upload source maps, and newer Wrangler releases do so by default
  uploadSourceMaps: false,
  dev: {
    types: { generate: false },
  },
})
