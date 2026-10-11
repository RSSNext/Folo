import type { Metadata } from 'next'
import * as React from 'react'

import { BuiltOpen } from '~/components/widgets/landing/BuiltOpen'
import { Features } from '~/components/widgets/landing/Features'
import { LandingHero } from '~/components/widgets/landing/Hero'
import { TrustedBy } from '~/components/widgets/landing/TrustedBy'
import { defaultLocale, locales } from '~/i18n/routing'
import {
  DISCOVER_FALLBACK,
  getHeroTimelineItems,
  getLandingMetrics,
  TRUSTED_COMPANIES,
  TRUSTED_RESEARCH_INSTITUTIONS,
} from '~/lib/landing-data'
import { getLocaleAlternates } from '~/lib/seo'

type LocaleParams = { locale?: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams> | LocaleParams | undefined
}): Promise<Metadata> {
  const locale = (params ? (await params).locale : undefined) ?? defaultLocale
  return {
    alternates: getLocaleAlternates(
      (locales as readonly string[]).includes(locale) ? locale : defaultLocale,
      '/',
    ),
  }
}

export default async function Home({
  params,
}: {
  params: Promise<LocaleParams> | LocaleParams | undefined
}) {
  const locale = params ? (await params).locale : undefined
  const [heroItems, metrics] = await Promise.all([
    getHeroTimelineItems(locale),
    getLandingMetrics(),
  ])

  return (
    <>
      <LandingHero items={heroItems} />
      <TrustedBy
        companies={TRUSTED_COMPANIES}
        researchers={TRUSTED_RESEARCH_INSTITUTIONS}
        metrics={metrics}
      />
      <Features discoverSources={DISCOVER_FALLBACK} />
      {/* <ViewsShowcase /> */}
      {/* <Audience /> */}
      <BuiltOpen />
    </>
  )
}
