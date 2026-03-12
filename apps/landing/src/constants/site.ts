export const APP_NAME = 'Folo'

export const siteInfo = {
  title: APP_NAME,
  description:
    'AI-powered RSS reader for deep, noise-free reading with contextual AI.',
  webUrl: 'https://folo.is',
  appUrl: 'https://app.folo.is',
  githubLink: 'https://github.com/RSSNext/Folo',
  githubApiLink: 'https://ungh.cc/repos/RSSNext/Folo',
  xLink: 'https://x.com/folo_is',
  discordLink: 'https://discord.gg/followapp',
  productHuntLink: 'https://www.producthunt.com/posts/follow-5',
  releaseLink: 'https://github.com/RSSNext/Folo/releases/latest',
  navigation: [
    { title: 'Features', href: '/#features' },
    { title: 'Testimonials', href: '/#testimonials' },
    { title: 'FAQ', href: '/#faq' },
  ],
  seo: {
    titleTemplate: '%s — AI-powered RSS Reader',
    defaultTitle: 'Folo — AI-powered RSS Reader',
    description:
      'AI-powered RSS reader for deep, noise-free reading with contextual AI.',
    keywords: [
      'RSS reader',
      'RSS',
      'RSSHub',
      'information browser',
      'content curation',
      'news aggregator',
      'feed reader',
      'AI-powered',
      'real-time updates',
      'content discovery',
      'social media integration',
      'cross-platform',
    ] as string[],
    authors: [{ name: 'Follow Team' }] as Array<{ name: string }>,
    creator: 'Follow Team',
    publisher: 'Follow Team',
    openGraph: {
      type: 'website' as const,
      locale: 'en_US',
      url: 'https://folo.is',
      siteName: 'Folo',
      title: 'Folo — AI-powered RSS Reader',
      description:
        'AI-powered RSS reader for deep, noise-free reading with contextual AI.',
      images: [
        {
          url: 'https://folo.is/opengraph-image.png',
          width: 1200,
          height: 630,
          alt: 'Folo — AI-powered RSS Reader',
        },
      ] as Array<{
        url: string
        width: number
        height: number
        alt: string
      }>,
    },
    twitter: {
      card: 'summary_large_image' as const,
      site: '@folo_is',
      creator: '@folo_is',
      title: 'Folo — AI-powered RSS Reader',
      description:
        'AI-powered RSS reader for deep, noise-free reading with contextual AI.',
      images: ['https://folo.is/opengraph-image.png'] as string[],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  },
} as const
