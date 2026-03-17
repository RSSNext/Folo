'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { Button } from '~/components/ui/button/Button'
import { cx } from '~/lib/cn'
import type { PricingPlan, PricingPlanLimit } from '~/lib/pricing-data'
import { FEATURE_ORDER } from '~/lib/pricing-data'

type BillingPeriod = 'monthly' | 'yearly'

const AI_MODEL_SELECTION_LABELS = {
  none: 'No AI model selection',
  curated: 'Curated models',
  high_performance: 'All high-end models',
} as const

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    trailingZeroDisplay: 'stripIfInteger',
  }).format(value)

const formatFeatureValue = (
  key: keyof PricingPlanLimit,
  value: PricingPlanLimit[keyof PricingPlanLimit] | null | undefined,
) => {
  if (value == null) {
    return '—'
  }

  if (key === 'AI_MODEL_SELECTION' && typeof value === 'string') {
    return AI_MODEL_SELECTION_LABELS[
      value as keyof typeof AI_MODEL_SELECTION_LABELS
    ]
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '—'
  }

  if (value === Number.MAX_SAFE_INTEGER) {
    return 'Unlimited'
  }

  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  if (Array.isArray(value)) {
    return value.join(' · ')
  }

  return String(value)
}

const getVisibleFeatures = (plans: PricingPlan[]) =>
  FEATURE_ORDER.filter((key) =>
    plans.some((plan) => {
      const value = plan.limit[key]
      if (value == null) return false
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return value > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== '0'
    }),
  )

export const PricingPlans: Component<{ plans: PricingPlan[] }> = ({
  plans,
}) => {
  const pricingT = useTranslations('pricing')
  const [billingPeriod, setBillingPeriod] =
    React.useState<BillingPeriod>('yearly')

  const visiblePlans = React.useMemo(
    () => plans.filter((plan) => plan.priceInDollars > 0),
    [plans],
  )
  const visibleFeatures = React.useMemo(
    () => getVisibleFeatures(plans),
    [plans],
  )

  const yearlySavings = React.useMemo(() => {
    const paidPlans = visiblePlans.filter(
      (plan) => plan.priceInDollars > 0 && plan.priceInDollarsAnnual > 0,
    )
    if (paidPlans.length === 0) return 0

    const total = paidPlans.reduce((acc, plan) => {
      const monthlyTotal = plan.priceInDollars * 12
      const yearlyTotal = plan.priceInDollarsAnnual
      return acc + ((monthlyTotal - yearlyTotal) / monthlyTotal) * 100
    }, 0)

    return Math.round(total / paidPlans.length)
  }, [visiblePlans])

  return (
    <section className="mx-auto mt-14 w-full max-w-[var(--container-max-width-2xl)] px-4 pb-28">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-accent/90">
          {pricingT('eyebrow')}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          {pricingT('headline')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          {pricingT('body')}
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-background-secondary p-1">
          <BillingTab
            active={billingPeriod === 'monthly'}
            label={pricingT('monthly')}
            onClick={() => setBillingPeriod('monthly')}
          />
          <BillingTab
            active={billingPeriod === 'yearly'}
            label={`${pricingT('yearly')} · ${pricingT('save', {
              percent: yearlySavings,
            })}`}
            onClick={() => setBillingPeriod('yearly')}
          />
        </div>
      </div>

      <div className="mx-auto mt-10 grid max-w-6xl gap-4 lg:grid-cols-3">
        {visiblePlans.map((plan) => (
          <PlanCard key={plan.name} billingPeriod={billingPeriod} plan={plan} />
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-[28px] border border-border/70 bg-background/90">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-background-secondary/70">
                <th className="sticky left-0 z-10 bg-background-secondary/70 px-5 py-4 text-left text-sm font-semibold">
                  {pricingT('table.features')}
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    className="px-5 py-4 text-center text-sm font-semibold"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleFeatures.map((featureKey, index) => (
                <tr
                  key={featureKey}
                  className={cx(
                    'border-b border-border/70',
                    index % 2 === 0
                      ? 'bg-background'
                      : 'bg-background-secondary/30',
                  )}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-5 py-4 text-sm font-medium text-text">
                    {pricingT(`features.${featureKey}`)}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={`${plan.name}-${featureKey}`}
                      className="px-5 py-4 text-center text-sm text-text-secondary"
                    >
                      {formatFeatureValue(featureKey, plan.limit[featureKey])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

const BillingTab = ({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'rounded-full px-4 py-2 text-sm transition-colors',
      active
        ? 'bg-accent text-white shadow-[0_12px_30px_-18px_rgba(255,92,0,0.65)]'
        : 'text-text-secondary hover:text-text',
    )}
  >
    {label}
  </button>
)

const PlanCard = ({
  billingPeriod,
  plan,
}: {
  billingPeriod: BillingPeriod
  plan: PricingPlan
}) => {
  const pricingT = useTranslations('pricing')
  const isYearly = billingPeriod === 'yearly'
  const price = isYearly ? plan.priceInDollarsAnnual / 12 : plan.priceInDollars
  const annualTotal = plan.priceInDollarsAnnual

  return (
    <div
      className={cx(
        'relative flex h-full flex-col justify-between rounded-[28px] border p-6 transition-colors',
        plan.isPopular
          ? 'border-accent/35 bg-background shadow-[0_26px_80px_-56px_rgba(255,92,0,0.55)]'
          : 'border-border/70 bg-background/88',
      )}
    >
      {plan.isPopular ? (
        <div className="absolute right-5 top-5 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
          {pricingT('mostPopular')}
        </div>
      ) : null}

      <div>
        <p className="text-2xl font-semibold text-text">{plan.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {pricingT(`descriptions.${plan.role}`)}
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span className="text-4xl font-semibold tracking-tight text-text">
            {formatCurrency(price)}
          </span>
          <span className="pb-1 text-sm text-text-secondary">
            / {pricingT('month')}
          </span>
        </div>

        {isYearly && annualTotal > 0 ? (
          <p className="mt-2 text-sm text-text-tertiary">
            {pricingT('billedYearly', {
              total: formatCurrency(annualTotal),
            })}
          </p>
        ) : null}

        <ul className="mt-6 space-y-3">
          {FEATURE_ORDER.slice(0, 6).map((featureKey) => (
            <li
              key={featureKey}
              className="flex gap-3 text-sm text-text-secondary"
            >
              <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-accent" />
              <span>
                <span className="text-text">
                  {formatFeatureValue(featureKey, plan.limit[featureKey])}
                </span>{' '}
                {pricingT(`features.${featureKey}`)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="https://app.folo.is"
          target="_blank"
          rel="noreferrer noopener"
        >
          <Button className="box-border w-full max-w-full px-4 text-sm">
            {plan.upgradeButtonText || pricingT('getStarted')}
          </Button>
        </Link>
      </div>
    </div>
  )
}
