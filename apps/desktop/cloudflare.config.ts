import { defineConfig, triggers } from "cf/config"

// folo.is
const zone = "115ea8e6a7865dbfc1cf4530d5f87f63"

// `cf deploy --mode dev` deploys folo-web-dev to dev.folo.is. Any other mode deploys folo-web to
// app.folo.is. The Worker only serves the files that `pnpm run build:web` writes to out/web
// (see wrangler.config.ts).
export default defineConfig(({ mode }) => {
  const isDev = mode === "dev"

  return {
    accountId: "1f1d1678a2413a54c944b3081bab5c84",
    worker: {
      name: isDev ? "folo-web-dev" : "folo-web",
      compatibilityDate: "2026-02-01",
      workersDev: true,
      observability: {
        logs: {
          enabled: true,
          invocationLogs: true,
        },
        traces: {
          enabled: true,
        },
      },
      assets: {
        notFoundHandling: "single-page-application",
      },
      triggers: [triggers.fetch({ pattern: isDev ? "dev.folo.is/*" : "app.folo.is/*", zone })],
    },
  }
})
