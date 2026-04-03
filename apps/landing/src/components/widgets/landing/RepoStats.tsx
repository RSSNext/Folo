'use client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { useGithubStar } from '~/hooks/biz/use-github-star'
import { cx, focusRing } from '~/lib/cn'

export function RepoStats() {
  const { data, isLoading } = useGithubStar()
  const stars = typeof data === 'number' && data >= 0 ? data : undefined
  const t = useTranslations('landing.repoStats')

  const format = (n?: number) =>
    typeof n === 'number' ? n.toLocaleString('en-US') : '—'

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 z-[1]">
      <StatBox
        icon="i-mingcute-star-fill text-[oklch(var(--color-yellow-60))]"
        label={t('githubStars')}
        value={isLoading ? '…' : format(stars)}
      />

      <StatBox
        icon="i-mingcute-shield-line"
        label={t('license')}
        value={t('licenseValue')}
      />

      <Link
        href="https://github.com/RSSNext/Folo"
        target="_blank"
        rel="noreferrer noopener"
        className={cx(
          'rounded-lg bg-material-medium/60 hover:bg-fill-secondary transition-colors px-3 py-2 flex',
          'flex flex-col relative align-start text-left justify-start',
          'col-span-2 lg:col-span-1',
          focusRing,
        )}
        aria-label={t('repoAriaLabel')}
      >
        <div className="flex items-center gap-2 text-text">
          <i className="i-simple-icons-github size-4" aria-hidden />
          <span className="text-sm">{t('repository')}</span>
        </div>
        <div className="mt-1 text-base tabular-nums text-text-tertiary">
          RSSNext/Folo
        </div>
        <i
          className="i-mingcute-arrow-right-up-line size-4 text-text-tertiary absolute right-3 top-8 lg:top-1/2 -translate-y-1/2"
          aria-hidden
        />

        <p className="text-xs block lg:hidden text-text-secondary mt-2">
          {t('repoDescriptionMobile')}
        </p>
      </Link>
    </div>
  )
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg z-[1] bg-material-medium/60 px-3 py-2">
      <div className="flex items-center gap-2 text-text">
        <i className={cx('size-4', icon)} aria-hidden />
        <span className="text-sm">{label}</span>
      </div>
      <div className="mt-1 text-base tabular-nums text-text-tertiary">
        {value}
      </div>
    </div>
  )
}

RepoStats.displayName = 'RepoStats'
