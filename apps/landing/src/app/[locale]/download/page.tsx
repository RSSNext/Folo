import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'

import { DownloadHero } from '~/components/widgets/download/DownloadHero'
import { PlatformDownloads } from '~/components/widgets/download/PlatformDownloads'
import { defaultLocale, locales } from '~/i18n/routing'
import { detectPlatform } from '~/lib/platform'

type LocaleParams = { locale?: string }

const localeSet = new Set(locales)

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams> | LocaleParams | undefined
}): Promise<Metadata> {
  const localeFromParams = params ? (await params).locale : undefined
  const locale =
    localeFromParams &&
    localeSet.has(localeFromParams as (typeof locales)[number])
      ? localeFromParams
      : defaultLocale
  const t = await getTranslations({ locale, namespace: 'download.metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function DownloadPage() {
  const ua = (await headers()).get('user-agent')?.toLowerCase()

  return (
    <>
      <DownloadHero />
      <PlatformDownloads detectedOS={detectPlatform(ua || '')} />
    </>
  )
}
