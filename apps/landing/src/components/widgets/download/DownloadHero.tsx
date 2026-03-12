'use client'

import clsx from 'clsx'
import { m, useScroll, useTransform } from 'motion/react'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { Highlighter } from '~/components/ui/highlighter'

export const DownloadHero: Component = () => {
  const ref = React.useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -120])
  const heroT = useTranslations('download.hero')

  return (
    <section ref={ref} className="relative isolate w-full">
      {/* Background glow + ultra-subtle grid */}
      <m.div
        className="pointer-events-none absolute inset-x-0 -inset-y-8 -z-10"
        style={{ y: bgY }}
      >
        <div className="mx-auto h-[380px] w-[800px] rounded-full bg-accent/10 blur-[130px]" />
        <div
          className={clsx(
            'pointer-events-none absolute inset-0 hidden md:block',
            'dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:48px_48px,48px_48px]',
          )}
        />
      </m.div>

      <div className="max-w-max-width-2xl px-4 mx-auto mt-28">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-text mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-balance md:text-6xl lg:text-7xl">
            {heroT.rich('title', {
              brand: (chunks) => (
                <Highlighter action="underline">
                  <span className="bg-linear-to-r from-accent to-accent/70 bg-clip-text text-transparent">
                    {chunks}
                  </span>
                </Highlighter>
              ),
            })}
          </h1>

          <p className="text-text-secondary mt-6 max-w-2xl mx-auto text-lg md:text-xl">
            {heroT('subtitle')}
          </p>
        </div>
      </div>
    </section>
  )
}

DownloadHero.displayName = 'DownloadHero'
