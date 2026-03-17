import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

import { PricingPlans } from '~/components/widgets/pricing/PricingPlans'
import { defaultLocale, locales } from '~/i18n/routing'
import { fetchPricingPlans } from '~/lib/pricing-data'

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
  const t = await getTranslations({ locale, namespace: 'pricing.metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function PricingPage() {
  const plans = await fetchPricingPlans()

  return <PricingPlans plans={plans} />
}
