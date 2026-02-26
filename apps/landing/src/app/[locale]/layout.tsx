import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'

import { HydrationEndDetector } from '~/components/common/HydrationEndDetector'
import { ScrollTop } from '~/components/common/ScrollTop'
import { Root } from '~/components/layout/root/Root'
import { LightRays } from '~/components/ui/light-rays'
import { LandingHeader } from '~/components/widgets/landing/Header'
import { siteInfo } from '~/constants/site'
import { locales } from '~/i18n/routing'
import { sansFont } from '~/lib/fonts'

import { Providers } from '../../providers/root'
import { ClientInit } from '../ClientInit'
import { init } from '../init'
import { InitInClient } from '../InitInClient'

init()

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata(
  params: Promise<{ locale: string }>,
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  const title = t('title', { defaultValue: siteInfo.title })
  const description = t('description', {
    defaultValue: siteInfo.description,
  })

  const keywordsString = t('keywords', {
    defaultValue: siteInfo.seo.keywords.join(', '),
  })
  const keywords = keywordsString.split(',').map((keyword) => keyword.trim())

  return {
    metadataBase: new URL(siteInfo.webUrl),
    title: {
      template: `%s · ${title}`,
      default: `${title} — ${description}`,
    },
    description,
    keywords,
    icons: [
      {
        rel: 'icon',
        url: '/favicon.ico',
      },
    ],
    alternates: {
      canonical: '/',
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
    openGraph: {
      title: {
        default: `${title} — ${description}`,
        template: `%s · ${title}`,
      },
      description,
      siteName: title,
      locale: locale === 'en' ? 'en_US' : locale,
      type: 'website',
      url: siteInfo.webUrl,
      images: [{ url: '/og.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — ${description}`,
      description,
      images: ['/og.png'],
    },
  }
}

export function generateViewport(): Viewport {
  return {
    themeColor: [
      { media: '(prefers-color-scheme: dark)', color: '#000212' },
      { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    ],
    initialScale: 1,
    viewportFit: 'cover',
    width: 'device-width',
    maximumScale: 1,
    minimumScale: 1,
    userScalable: false,
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <>
      <ClientInit />
      <html lang={locale} suppressHydrationWarning>
        <head>
          <HydrationEndDetector />
        </head>
        <body className={`${sansFont.variable} m-0 h-full p-0 font-sans`}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>
              <div data-theme>
                <Root>
                  <LightRays
                    length="600px"
                    className="absolute inset-x-0 -top-6 h-[750px]"
                    color="#ff5c0010"
                  />

                  <LandingHeader />
                  {children}
                </Root>
              </div>
            </Providers>
          </NextIntlClientProvider>

          <ScrollTop />
          <InitInClient />
        </body>
      </html>
    </>
  )
}
