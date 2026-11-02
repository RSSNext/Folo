import { bindings, defineConfig, triggers } from 'cf/config'

// folo.is
const zone = '115ea8e6a7865dbfc1cf4530d5f87f63'

// Build with `vinext build --mode dev` and deploy with `cf deploy --prebuilt --mode dev` to ship
// landing-next-dev to landing.dev.folo.is. Any other mode ships landing-vinext to folo.is. The
// Cloudflare Vite plugin adds the client build to the Build Output as the static assets.
export default defineConfig(({ mode }) => {
  const isDev = mode === 'dev'

  return {
    accountId: '1f1d1678a2413a54c944b3081bab5c84',
    worker: {
      name: isDev ? 'landing-next-dev' : 'landing-vinext',
      compatibilityDate: '2026-02-01',
      compatibilityFlags: ['nodejs_compat'],
      entrypoint: './worker/index.js',
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
        notFoundHandling: 'none',
      },
      triggers: [
        triggers.fetch({
          pattern: isDev ? 'landing.dev.folo.is/*' : 'folo.is/*',
          zone,
        }),
      ],
      env: {
        IMAGES: bindings.images(),
        ASSETS: bindings.assets(),
      },
    },
  }
})
