import * as React from 'react'

import { BuiltOpen } from '~/components/widgets/landing/BuiltOpen'
import { Features } from '~/components/widgets/landing/Features'
import { LandingHero } from '~/components/widgets/landing/Hero'
import { TrustedBy } from '~/components/widgets/landing/TrustedBy'
import {
  DISCOVER_FALLBACK,
  getHeroTimelineItems,
  getLandingMetrics,
  TRUSTED_COMPANIES,
} from '~/lib/landing-data'

type LocaleParams = { locale?: string }

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
      <TrustedBy companies={TRUSTED_COMPANIES} metrics={metrics} />
      <Features discoverSources={DISCOVER_FALLBACK} />
      {/* <ViewsShowcase /> */}
      {/* <Audience /> */}
      <BuiltOpen />
    </>
  )
}
