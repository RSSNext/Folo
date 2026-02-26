import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import GithubTrending from '~/components/common/GithubTrending'
import { cx } from '~/lib/cn'

import { RepoStats } from './RepoStats'

export const BuiltOpen: Component = () => {
  const builtOpenT = useTranslations('landing.builtOpen')

  return (
    <section
      id="open"
      className="mx-auto mt-24 md:mt-28 lg:mt-32 w-full max-w-max-width-2xl px-0 lg:px-4"
    >
      <div>
        <DesignGuideLine axis="y" className="translate-x-6 md:translate-x-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8">
          {/* Left column: copy + CTA */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h2
              className={clsx(
                'mt-2 text-2xl font-semibold tracking-tight',
                'before:inset-x-0 before:h-px before:bg-border/50 before:absolute',
                'after:inset-x-0 after:h-px after:bg-border/50 after:absolute after:translate-y-8',
                'before:hidden lg:before:block',
                'after:hidden lg:after:block',
              )}
            >
              <span className="inline-flex">
                {builtOpenT('title')}
                <DesignGuideLine axis="y" />
              </span>
            </h2>
            <div className="flex flex-row">
              <p
                className={clsx(
                  'mt-2 text-text-secondary',
                  'before:inset-x-0 before:h-px before:bg-border/50 before:absolute',
                  'before:hidden lg:before:block',
                )}
              >
                {builtOpenT('body')}
              </p>

              <DesignGuideLine axis="y" />
            </div>
            <DesignGuideLine axis="x" />
            <div className="mt-4 flex flex-wrap justify-center flex-col">
              <DesignGuideLine axis="x" />
              <GithubTrending />
              <DesignGuideLine axis="x" />
            </div>

            {/* Tech stack chips */}
            <div className="flex flex-col mt-6">
              <div className=" flex flex-row">
                <DesignGuideLine axis="x" />
                <ul className="flex flex-wrap gap-2 text-xs text-text-secondary">
                  {STACK.map((s) => (
                    <li
                      key={s.label}
                      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-1"
                    >
                      <i className={cx('size-3.5', s.icon)} aria-hidden />
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ul>

                <DesignGuideLine axis="y" />
              </div>
              <DesignGuideLine axis="x" />
            </div>
          </div>

          {/* Right column: repo stats / blueprint stage */}
          <div className="lg:col-span-6">
            {/* stage frame */}
            <div className="mx-0 lg:mx-5 mt-4 lg:mt-12">
              <div className="gap-4 flex flex-col">
                <RepoStats />

                {/* small blueprint note */}
                <div className="flex-row hidden lg:flex mt-4 lg:mt-9.5">
                  <DesignGuideLine axis="y" />
                  <div className="rounded-lg border flex z-1 flex-row border-border/60 bg-material-medium/60 px-3 py-2 text-xs text-text-secondary">
                    <p>{builtOpenT('note')}</p>
                  </div>
                  <DesignGuideLine axis="y" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

BuiltOpen.displayName = 'BuiltOpen'

const STACK = [
  // { label: 'Next.js 15', icon: 'i-simple-icons-nextdotjs' },
  { label: 'React 19', icon: 'i-simple-icons-react' },
  { label: 'Tailwind', icon: 'i-simple-icons-tailwindcss' },
  { label: 'Radix UI', icon: 'i-simple-icons-radixui' },
  { label: 'Framer Motion', icon: 'i-simple-icons-framer' },
]

const DesignGuideLine: Component<{ axis: 'x' | 'y' }> = ({
  axis,
  className,
}) => {
  return (
    <div className="hidden lg:block">
      {axis === 'x' ? (
        <div
          className={clsx(
            'before:inset-x-0 before:h-px before:bg-border/50 before:absolute z-[-1]',
            className,
          )}
        />
      ) : (
        <div
          className={clsx(
            'absolute bottom-0 h-[600px] w-px bg-border/50 z-[-1]',
            className,
          )}
        />
      )}
    </div>
  )
}
