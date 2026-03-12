'use client'

import clsx from 'clsx'
import { m, useScroll, useTransform } from 'motion/react'
import NextLink from 'next/link'
import { useTranslations } from 'next-intl'
import * as React from 'react'
import { useRef } from 'react'
import { useResizable } from 'react-resizable-layout'

import { useIsMobile } from '~/atoms'
import { BorderBeam } from '~/components/ui/border-beam'
import { Button } from '~/components/ui/button'
import { ParticlesAura } from '~/components/ui/effects/ParticlesAura'
import { TiltCard } from '~/components/ui/effects/TiltCard'
import { Highlighter } from '~/components/ui/highlighter'
import { PanelSplitter } from '~/components/ui/panel/PanelSplitter'
import { Link as LocalizedLink } from '~/i18n/routing'

import { ListDemo } from '../simulators/ListDemo'
import { TimelineChatDemo } from '../simulators/TimelineChatDemo'
import { WindowChrome } from './WindowChrome'

export const LandingHero: Component = () => {
  const ref = React.useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -150])
  const heroT = useTranslations('landing.hero')
  const actionsT = useTranslations('common.actions')

  return (
    <section ref={ref} className="relative isolate w-full">
      {/* Background glow + ultra-subtle grid */}
      <m.div
        className="pointer-events-none absolute inset-x-0 -inset-y-8 -z-10"
        style={{ y: bgY }}
      >
        <div className="mx-auto h-[420px] w-[900px] rounded-full bg-accent/10 blur-[140px]" />
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 hidden md:block',
            'dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px,48px_48px]',
          )}
        />
      </m.div>

      <div className="max-w-max-width-2xl px-4 mx-auto mt-28">
        <div className="mx-auto max-w-5xl text-left">
          <h1 className="text-text mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-7xl">
            {heroT.rich('title', {
              brand: (chunks) => (
                <span className="bg-linear-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
              highlight: (chunks) => (
                <Highlighter action="underline" color="#FF9800">
                  <span className="bg-linear-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                </Highlighter>
              ),
            })}
          </h1>
          <div className="text-text-secondary mt-6 max-w-2xl text-lg md:text-xl">
            <p>{heroT('bodyLine1')}</p>
            <p>{heroT('bodyLine2')}</p>
          </div>

          <div className="mt-8 flex items-center">
            <NextLink
              href="https://app.folo.is"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="relative inline-flex">
                <Button className="group relative text-base overflow-hidden px-5 py-2.5 bg-accent text-accent-foreground shadow-[0_0_0_1px_var(--color-accent-40)] ![filter:drop-shadow(0_0_24px_color-mix(in_oklab,var(--color-accent)_35%,transparent))] rounded-xl">
                  <span
                    aria-hidden
                    className={clsx(
                      'pointer-events-none absolute -inset-1 rounded-[inherit] opacity-70 blur-md',
                      'bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-accent)_55%,transparent)_0%,transparent_70%)]',
                    )}
                  />

                  <span className="relative z-10 inline-flex items-center">
                    {actionsT('getStarted')}
                  </span>
                  <BorderBeam colorFrom="#fff" colorTo="#ff5c00" />
                </Button>

                <ParticlesAura className="-inset-2" />
              </span>
            </NextLink>
            <LocalizedLink href="/download">
              <Button variant="ghost" className="ml-4">
                <span className="relative z-10 inline-flex items-center text-base">
                  {actionsT('download')}
                </span>
              </Button>
            </LocalizedLink>
            {/* <a
            href="#learn-more"
            className="text-text-secondary hover:text-text inline-flex items-center gap-1 text-sm"
          >
            <span className="rounded-full border border-border bg-fill px-2 py-1 text-xs">
              New
            </span>
            <span>Product Intelligence</span>
            <i className="i-mingcute-right-line" aria-hidden />
          </a> */}
          </div>
        </div>

        {/* Preview card with tilt + parallax; prompt focus zoom */}
        <PreviewAppDemo />
      </div>
    </section>
  )
}

const PreviewAppDemo = () => {
  const layoutContainerRef = useRef<HTMLDivElement | null>(null)
  const {
    position: columnWidth,
    separatorProps,
    isDragging: isDragging,
  } = useResizable({
    axis: 'x',
    min: 300,
    max: 500,
    initial: 300,
    containerRef: layoutContainerRef as React.RefObject<HTMLElement>,
  })

  const isMobile = useIsMobile()

  return (
    <div className="mx-auto mt-10 max-w-5xl relative">
      <TiltCard intensity={3} glare className="tilt">
        <WindowChrome showTryOnWeb={false}>
          <div
            ref={layoutContainerRef}
            className="relative lg:aspect-video h-[800px] lg:h-auto w-full bg-background-secondary"
          >
            <div style={{ width: columnWidth }} className="size-full">
              <ListDemo />
              {/* <ListSkeletonDemo /> */}
            </div>

            <div
              className="absolute right-0 inset-y-0"
              style={{ left: columnWidth }}
            >
              <PanelSplitter {...separatorProps} isDragging={isDragging} />
            </div>
            <div
              className="absolute lg:right-0 inset-0 border-t lg:border-t-0  lg:top-0 top-1/6 lg:border-l"
              style={{ left: isMobile ? undefined : columnWidth }}
            >
              {isMobile && (
                <div
                  className="absolute top-0 inset-x-0 shadow-2xl z-0"
                  style={{
                    boxShadow: '0 25px 50px 63px #00000020',
                  }}
                />
              )}
              <div className="size-full z-1 relative">
                <TimelineChatDemo />
              </div>
            </div>
          </div>
        </WindowChrome>
      </TiltCard>
    </div>
  )
}
LandingHero.displayName = 'LandingHero'
