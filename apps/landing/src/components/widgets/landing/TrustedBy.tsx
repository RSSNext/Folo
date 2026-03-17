'use client'

import { useTranslations } from 'next-intl'

import type { LandingMetrics, TrustedCompany } from '~/lib/landing-data'

type TrustedByProps = {
  companies: TrustedCompany[]
  metrics: LandingMetrics
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatCompact = (value: number) => compactFormatter.format(value)

export const TrustedBy: Component<TrustedByProps> = ({
  companies,
  metrics,
}) => {
  const trustedT = useTranslations('landing.trustedBy')
  const metricsT = useTranslations('landing.metrics')

  const metricCards = [
    {
      label: metricsT('cards.feeds.label'),
      value: formatCompact(metrics.feeds),
    },
    {
      label: metricsT('cards.entries.label'),
      value: formatCompact(metrics.entries),
    },
  ]

  return (
    <section className="mx-auto mt-14 w-full max-w-[var(--container-max-width-2xl)] px-4 md:mt-16 lg:mt-20">
      <div className="flex flex-col gap-16">
        <div className="flex flex-col items-center gap-5 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent/90">
            {trustedT('eyebrow')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {companies.map((company) => (
              <div
                key={company.name}
                className="inline-flex items-center gap-2.5"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-background-secondary p-1">
                  <img
                    src={`https://icons.folo.is/${company.host}`}
                    alt={company.name}
                    className="size-full rounded-full object-cover grayscale"
                    loading="lazy"
                  />
                </div>
                <span className="text-sm font-medium text-text">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-text-tertiary">
            {metricsT('headline')}
          </p>
          <p className="text-sm text-text-secondary">{metricsT('body')}</p>

          <div className="flex flex-wrap items-end justify-center gap-x-14 gap-y-4">
            {metricCards.map((card) => (
              <div key={card.label}>
                <p className="text-[11px] uppercase tracking-[0.22em] text-text-tertiary">
                  {card.label}
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-text">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

TrustedBy.displayName = 'TrustedBy'
