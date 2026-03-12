'use client'
import { AnimatePresence, m } from 'motion/react'
import * as React from 'react'

import { cx, focusRing } from '~/lib/cn'
import { Spring } from '~/lib/spring'

export const Audience: Component = () => {
  const audiences = React.useMemo(
    () => [
      {
        key: 'researchers',
        label: 'Folo.is for Researchers',
        title: (
          <>
            <a
              className="text-accent underline underline-offset-4"
              href="http://Folo.is"
              target="_blank"
              rel="noreferrer"
            >
              Folo.is
            </a>{' '}
            for Researchers
          </>
        ),
        description:
          'Have an AI twin that reads the literature, tracks sources, and surfaces only what matters.',
      },
      {
        key: 'builders',
        label: 'Folo.is for Builders',
        title: (
          <>
            <a
              className="text-accent underline underline-offset-4"
              href="http://Folo.is"
              target="_blank"
              rel="noreferrer"
            >
              Folo.is
            </a>{' '}
            for Builders
          </>
        ),
        description:
          'Turn endless product news and tech updates into focused signals that drive what you build.',
      },
      {
        key: 'creators',
        label: 'Folo.is for Creators',
        title: (
          <>
            <a
              className="text-accent underline underline-offset-4"
              href="http://Folo.is"
              target="_blank"
              rel="noreferrer"
            >
              Folo.is
            </a>{' '}
            for Creators
          </>
        ),
        description:
          'Stay ahead of trends and conversations without drowning in feeds — AI reads them for you.',
      },
      {
        key: 'investors',
        label: 'Folo.is for Investors',
        title: (
          <>
            <a
              className="text-accent underline underline-offset-4"
              href="http://Folo.is"
              target="_blank"
              rel="noreferrer"
            >
              Folo.is
            </a>{' '}
            for Investors
          </>
        ),
        description:
          'From markets to memos, let AI digest the noise and deliver the signals that move capital.',
      },
    ],
    [],
  )

  const [activeIndex, setActiveIndex] = React.useState(0)
  const buttonsRef = React.useRef<Array<HTMLButtonElement | null>>([])

  const [autoPlay, setAutoPlay] = React.useState(true)
  const [videoRef, setVideoRef] = React.useState<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // entry.target.play()
          setAutoPlay(true)
        } else {
          setAutoPlay(false)
        }
      })
    })
    if (videoRef) {
      intersectionObserver.observe(videoRef)
    }
    return () => {
      intersectionObserver.disconnect()
    }
  }, [videoRef])
  // TODO when video plays, stop autoplay
  // autoplay: cycle every 6s
  React.useEffect(() => {
    const id = setInterval(() => {
      if (!autoPlay) return
      setActiveIndex((i) => (i + 1) % audiences.length)
    }, 6000)
    return () => clearInterval(id)
  }, [audiences.length, autoPlay])

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let next = index
      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault()
          next = (index + 1) % audiences.length
          break
        }
        case 'ArrowLeft': {
          e.preventDefault()
          next = (index - 1 + audiences.length) % audiences.length
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          next = (index + 1) % audiences.length
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          next = (index - 1 + audiences.length) % audiences.length
          break
        }
        case 'Home': {
          e.preventDefault()
          next = 0
          break
        }
        case 'End': {
          e.preventDefault()
          next = audiences.length - 1
          break
        }
        case 'Enter': {
          e.preventDefault()
          setActiveIndex(index)
          return
        }
        case ' ': {
          e.preventDefault()
          setActiveIndex(index)
          return
        }
        default: {
          break
        }
      }
      if (next !== index) {
        buttonsRef.current[next]?.focus()
        setActiveIndex(next)
      }
    },
    [audiences.length],
  )

  const active = audiences[activeIndex]

  return (
    <section
      id="audience"
      className="mx-auto mt-28 md:mt-32 lg:mt-40 w-full max-w-[var(--container-max-width-2xl)] px-4"
    >
      {/* Header */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-end gap-8 lg:grid-cols-2">
        <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Made for modern knowledge workers
        </h2>
        <p className="text-pretty text-text-secondary">
          Folo is shaped by practices that keep you focused: clean timelines,
          contextual AI, and performance built in. Switch from scattered tabs to
          signal-first reading.{' '}
          <a
            className="text-accent underline underline-offset-4"
            href="https://app.folo.is"
            target="_blank"
            rel="noreferrer"
          >
            Make the switch
          </a>
        </p>
      </div>

      {/* Stepper Board - steps on top, stage below */}
      <div className="mx-auto mt-10 max-w-5xl flex flex-col gap-4">
        {/* Steps (horizontal) */}
        <div
          role="tablist"
          aria-orientation="horizontal"
          className="flex flex-wrap items-center gap-2"
        >
          {audiences.map((item, i) => {
            const selected = i === activeIndex
            return (
              <button
                key={item.key}
                ref={(el) => {
                  buttonsRef.current[i] = el
                }}
                role="tab"
                id={`audience-tab-${item.key}`}
                aria-selected={selected}
                aria-controls="audience-panel"
                tabIndex={selected ? 0 : -1}
                type="button"
                onClick={() => setActiveIndex(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cx(
                  'group inline-flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors',
                  selected ? 'bg-material-medium/60' : 'hover:bg-fill/60',
                  focusRing,
                )}
              >
                <span
                  className={cx(
                    'tabular-nums text-xs text-text-secondary',
                    selected && 'text-accent',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={cx(
                    'text-sm font-medium tracking-tight',
                    selected ? 'text-text' : 'text-text-secondary',
                  )}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stage */}
        <div ref={setVideoRef}>
          <AnimatePresence mode="popLayout">
            <m.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={Spring.presets.smooth}
              key={active.key}
              role="tabpanel"
              id="audience-panel"
              aria-labelledby={`audience-tab-${active.key}`}
              className="rounded-2xl border border-border bg-background p-4 aspect-[16/9] w-full overflow-hidden"
            >
              <div className="relative size-full rounded-xl border border-border bg-fill-secondary">
                <div className="absolute left-2 top-2 rounded bg-background/60 px-2 py-1 text-xs text-text-secondary">
                  video · pending demo app
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                  {active.title}
                </h3>
                <p className="text-pretty text-sm text-text-secondary mt-1">
                  {active.description}
                </p>
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

Audience.displayName = 'Audience'
