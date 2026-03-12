import { config } from 'dotenv'
import createNextIntlPlugin from 'next-intl/plugin'

process.title = 'Folo Landing (vinext)'

const env = config().parsed || {}
const isProd = process.env.NODE_ENV === 'production'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  output: 'standalone',

  reactCompiler: true,
  assetPrefix: isProd ? env.ASSETPREFIX || undefined : undefined,
  compiler: {
    // reactRemoveProperties: { properties: ['^data-id$', '^data-(\\w+)-id$'] },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'self'; script-src 'none'; sandbox; style-src 'unsafe-inline';",
  },

  async rewrites() {
    return {
      beforeFiles: [
        { source: '/atom.xml', destination: '/feed' },
        { source: '/sitemap.xml', destination: '/sitemap' },
        {
          source: '/.well-known/apple-app-site-association',
          destination: '/apple-app-site-association',
        },
      ],
    }
  },
}

export default withNextIntl(nextConfig)
