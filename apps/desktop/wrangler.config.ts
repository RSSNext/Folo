import { defineWranglerConfig } from "wrangler/experimental-config"

// Build settings for the Wrangler bundler that `cf build` runs. The assets-only Worker has no
// bindings to type, so `cf dev` does not write worker-configuration.d.ts.
export default defineWranglerConfig({
  assetsDirectory: "./out/web",
  dev: {
    types: { generate: false },
  },
})
