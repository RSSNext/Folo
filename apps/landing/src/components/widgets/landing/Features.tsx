'use client'

import { useTranslations } from 'next-intl'
import * as React from 'react'

import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'
import { cx } from '~/lib/cn'
import type { DiscoverSource } from '~/lib/landing-data'

import { EntryPageDemo } from '../simulators/EntryPage'
import { WindowChrome } from './WindowChrome'

type FeaturesProps = {
  discoverSources: DiscoverSource[]
}

export const Features: Component<FeaturesProps> = ({ discoverSources }) => {
  const featuresT = useTranslations('landing.features')

  return (
    <section
      id="features"
      className="mx-auto mt-24 w-full max-w-[var(--container-max-width-2xl)] px-4 md:mt-28 lg:mt-32"
    >
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight">
          {featuresT('headline')}
        </h2>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-y-20">
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
        >
          <DiscoverWindow sources={discoverSources} />
        </FeatureGridItem>

        <FeatureGridItem
          eyebrow={
            <span className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <i className="i-mingcute-sparkles-line text-accent" aria-hidden />
              {featuresT('vibe.label')}
            </span>
          }
          titleStrong={featuresT('vibe.titleStrong')}
          titleRest={featuresT('vibe.titleRest')}
        >
          <WindowChrome>
            <div className="relative h-[880px] w-full overflow-hidden bg-background-secondary lg:h-[720px]">
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
}

function FeatureGridItem({
  eyebrow,
  titleStrong,
  titleRest,
  children,
  className,
}: FGProps) {
  return (
    <div className={cx('relative', className)}>
      <div className="mb-3 flex items-center gap-2 pl-1">{eyebrow}</div>
      <h3 className="text-xl font-semibold leading-snug tracking-tight sm:text-[2rem]">
        {titleStrong}{' '}
        {titleRest ? (
          <span className="font-normal text-text-secondary">{titleRest}</span>
        ) : null}
      </h3>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function DiscoverWindow({ sources }: { sources: DiscoverSource[] }) {
  const [allSources, setAllSources] = React.useState(sources)

  React.useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/discover-sources.json')
        if (!response.ok) return

        const nextSources = (await response.json()) as DiscoverSource[]
        if (!cancelled && nextSources.length > 0) {
          setAllSources(nextSources)
        }
      } catch {
        // Ignore network failures in dev and keep the bundled fallback data.
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <WindowChrome>
      <div className="bg-background-secondary p-6 md:p-8">
        <div className="rounded-[30px] bg-background/92 px-5 py-5 shadow-[0_24px_80px_-56px_rgba(0,0,0,0.3)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-text">
                {allSources.length.toLocaleString('en-US')} official sources
              </p>
              <p className="mt-1 text-xs text-text-tertiary">
                Browse supported websites.
              </p>
            </div>
          </div>

          <ScrollArea rootClassName="mt-5 h-[560px]" viewportClassName="pr-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {allSources.map((source) => (
                <div
                  key={source.host}
                  className="flex items-center gap-3 rounded-2xl bg-background-secondary/80 px-3 py-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_12px_24px_-18px_rgba(0,0,0,0.35)]">
                    <img
                      src={`https://icons.folo.is/${source.host}`}
                      alt={source.name}
                      className="size-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {source.name}
                    </p>
                    <p className="truncate text-xs text-text-tertiary">
                      {source.host}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </WindowChrome>
  )
}

Features.displayName = 'Features'
