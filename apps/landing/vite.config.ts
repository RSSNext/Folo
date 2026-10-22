import { fileURLToPath } from 'node:url'

import { cloudflare } from '@cloudflare/vite-plugin'
import vinext from 'vinext'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: 'rsc',
        childEnvironments: ['ssr'],
      },
    }),
  ],
  // The Cloudflare Vite plugin emits Worker source maps by default and `cf deploy` uploads them.
  // The Worker has never uploaded source maps, so keep them off for its environments.
  environments: {
    rsc: { build: { sourcemap: false } },
    ssr: { build: { sourcemap: false } },
  },
  optimizeDeps: {
    exclude: [
      'next-intl',
      'next-intl/navigation',
      'next-intl/routing',
      'use-intl',
    ],
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
  },
  resolve: {
    alias: {
      'next-intl/config': fileURLToPath(
        new URL('src/i18n/request.ts', import.meta.url),
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
})
