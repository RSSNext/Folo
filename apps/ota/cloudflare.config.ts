import { bindings, defineConfig, triggers } from "cf/config"

// folo.is
const zone = "115ea8e6a7865dbfc1cf4530d5f87f63"

// `cf deploy --mode dev` deploys folo-ota-dev. Its KV namespace and R2 bucket are still
// placeholders, so that Worker has never been deployed. Any other mode deploys folo-ota.
// `cf dev` uses local KV and R2 data.
export default defineConfig(({ mode }) => {
  const isDev = mode === "dev"

  return {
    accountId: "1f1d1678a2413a54c944b3081bab5c84",
    worker: {
      name: isDev ? "folo-ota-dev" : "folo-ota",
      compatibilityDate: "2026-04-10",
      compatibilityFlags: ["nodejs_compat"],
      entrypoint: "src/index.ts",
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
      domains: isDev ? undefined : ["ota.folo.is"],
      triggers: [
        ...(isDev ? [triggers.fetch({ pattern: "ota.dev.folo.is/*", zone })] : []),
        triggers.scheduled({ schedule: "*/5 * * * *" }),
      ],
      env: {
        GITHUB_OWNER: bindings.text("RSSNext"),
        GITHUB_REPO: bindings.text("Folo"),
        OTA_SYNC_TOKEN_HEADER: bindings.text("x-ota-sync-token"),
        OTA_KV: bindings.kv({
          id: isDev ? "REPLACE_WITH_DEV_KV_ID" : "bcb477ad28284a74a7b4a6bfe231c228",
        }),
        OTA_BUCKET: bindings.r2({
          name: isDev ? "replace-with-dev-bucket-name" : "follow-ota",
        }),
      },
    },
  }
})
