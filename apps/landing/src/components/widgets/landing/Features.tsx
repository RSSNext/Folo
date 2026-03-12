'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import { cx } from '~/lib/cn'

import { EntryPageDemo } from '../simulators/EntryPage'
import { WindowChrome } from './WindowChrome'

export const Features: Component = () => {
  // No autoplay/tabs in grid layout; keep light state for potential hovers
  const [_hover, setHover] = React.useState<string | null>(null)
  const featuresT = useTranslations('landing.features')

  return (
    <section
      id="features"
      className="mx-auto mt-24 md:mt-28 lg:mt-32 w-full max-w-[var(--container-max-width-2xl)] px-4"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          {featuresT('headline')}
        </h2>
      </div>
      {/* Grid layout with subtle center dividers (Vercel-like) */}
      <div className="relative mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-x-8 gap-y-32 lg:grid-cols-2">
        {/* Card 1: Discover */}
        <FeatureGridItem
          eyebrow={
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <i
                className="i-mingcute-compass-3-line text-accent"
                aria-hidden
              />
              {featuresT('discover.label')}
            </span>
          }
          titleStrong={featuresT('discover.titleStrong')}
          titleRest={featuresT('discover.titleRest')}
          onHover={() => setHover('discover')}
        >
          <WindowChrome>
            <div className="relative aspect-video w-full bg-background-secondary" />
          </WindowChrome>
        </FeatureGridItem>

        {/* Card 2: Digital Twin */}
        <FeatureGridItem
          eyebrow={
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <i className="i-lucide-brain text-accent" aria-hidden />
              {featuresT('twin.label')}
            </span>
          }
          titleStrong={featuresT('twin.titleStrong')}
          titleRest={featuresT('twin.titleRest')}
          onHover={() => setHover('twin')}
        >
          <WindowChrome>
            <div className="relative aspect-video w-full bg-background-secondary" />
          </WindowChrome>
        </FeatureGridItem>

        {/* Card 3: Vibe Read (spans) */}
        <FeatureGridItem
          eyebrow={
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <i className="i-mingcute-sparkles-line text-accent" aria-hidden />
              {featuresT('vibe.label')}
            </span>
          }
          titleStrong={featuresT('vibe.titleStrong')}
          titleRest={featuresT('vibe.titleRest')}
          className="lg:col-span-2"
          onHover={() => setHover('vibe')}
        >
          <div className="h-px bg-border -translate-y-16 w-full absolute top-0 inset-x-0" />

          <WindowChrome>
            <div className="relative lg:aspect-video h-[800px] lg:h-auto w-full bg-background-secondary">
              <EntryPageDemo />
            </div>
          </WindowChrome>
        </FeatureGridItem>
      </div>
    </section>
  )
}

type FGProps = {
  eyebrow: React.ReactNode
  titleStrong: string
  titleRest?: string
  children: React.ReactNode
  className?: string
  onHover?: () => void
}

function FeatureGridItem({
  eyebrow,
  titleStrong,
  titleRest,
  children,
  className,
  onHover,
}: FGProps) {
  return (
    <div className={cx('relative', className)} onMouseEnter={onHover}>
      <div className="mb-3 flex items-center gap-2 pl-1">{eyebrow}</div>
      <h3 className="text-xl font-semibold leading-snug tracking-tight">
        {titleStrong}{' '}
        {titleRest ? (
          <span className="text-text-secondary font-normal">{titleRest}</span>
        ) : null}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  )
}

Features.displayName = 'Features'
