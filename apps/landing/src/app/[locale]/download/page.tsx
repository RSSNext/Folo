import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'

import { DownloadHero } from '~/components/widgets/download/DownloadHero'
import { PlatformDownloads } from '~/components/widgets/download/PlatformDownloads'
import { detectPlatform } from '~/lib/platform'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
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
