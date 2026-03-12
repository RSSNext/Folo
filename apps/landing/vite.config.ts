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
  resolve: {
    alias: {
      'next-intl/config': fileURLToPath(
        new URL('src/i18n/request.ts', import.meta.url),
      ),
    },
  },
})
