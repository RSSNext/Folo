'use client'

import { m } from 'motion/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import type {
  OS,
  PlatformDownloadChannel,
  PlatformDownloadGroup,
} from '~/constants/download'
import { PlatformDownloadGroups } from '~/constants/download'
import { Link as LocalizedLink } from '~/i18n/routing'
import { cx, focusRing } from '~/lib/cn'
import { Spring } from '~/lib/spring'

type PlatformDownloadsProps = {
  detectedOS: OS | null
}

const getPlatformGroups = (
  detectedOS: OS | null,
  showAllPlatforms: boolean,
): PlatformDownloadGroup[] => {
  if (!detectedOS) {
    return PlatformDownloadGroups
  }

  const currentPlatform = PlatformDownloadGroups.find(
    (group) => group.os === detectedOS,
  )
  const otherPlatforms = PlatformDownloadGroups.filter(
    (group) => group.os !== detectedOS,
  )

  return showAllPlatforms
    ? ([currentPlatform, ...otherPlatforms].filter(
        Boolean,
      ) as PlatformDownloadGroup[])
    : currentPlatform
      ? [currentPlatform]
      : PlatformDownloadGroups
}

export const PlatformDownloads: Component<PlatformDownloadsProps> = ({
  detectedOS,
}) => {
  const platformT = useTranslations('download.platforms')
  const [showAllPlatforms, setShowAllPlatforms] = React.useState(false)

  const platformGroups = getPlatformGroups(detectedOS, showAllPlatforms)
  const webTitle = platformT('web.title')
  const webSubtitle = platformT('web.subtitle')
  const footer = platformT.rich('footer', {
    terms: (chunks) => (
      <LocalizedLink
        href="/terms-of-service"
        className="text-text-secondary hover:text-accent transition-colors"
      >
        {chunks}
      </LocalizedLink>
    ),
    privacy: (chunks) => (
      <LocalizedLink
        href="/privacy-policy"
        className="text-text-secondary hover:text-accent transition-colors"
      >
        {chunks}
      </LocalizedLink>
    ),
  })

  return (
    <section
      id="downloads"
      className="mx-auto mt-16 md:mt-20 w-full max-w-max-width-2xl px-4 pb-32"
    >
      <div className="mx-auto max-w-4xl">
        <div className="space-y-8">
          {platformGroups.map((group, groupIndex) => (
            <m.div
              key={group.os}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                ...Spring.presets.smooth,
                delay: groupIndex * 0.05,
              }}
            >
              <div className="mb-5 flex items-end justify-between gap-4">
                <div className="flex items-center gap-4">
                  <i
                    className={cx(group.icon, 'size-12 shrink-0 text-accent')}
                    aria-hidden
                  />

                  <div className="space-y-1">
                    <p className="text-sm text-text-secondary">
                      {detectedOS === group.os
                        ? platformT('recommended')
                        : platformT('allPlatforms')}
                    </p>
                    <h3 className="text-3xl leading-none font-semibold text-text">
                      {platformT(`${group.os}.label`, {
                        defaultValue: group.label,
                      })}
                    </h3>
                  </div>
                </div>

                <div className="text-sm text-text-tertiary">
                  <p className="text-sm">{group.channels.length} options</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {group.channels.map((channel) => (
                  <DownloadChannelCard key={channel.id} channel={channel} />
                ))}
              </div>
            </m.div>
          ))}
        </div>

        {detectedOS && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowAllPlatforms((value) => !value)}
              className={cx(
                'inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text hover:border-accent/30',
                focusRing,
              )}
            >
              {showAllPlatforms
                ? platformT('lessDownloads')
                : platformT('moreDownloads')}
              <i
                className={cx(
                  'i-mingcute-down-line transition-transform',
                  showAllPlatforms && 'rotate-180',
                )}
                aria-hidden
              />
            </button>
          </div>
        )}

        <m.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...Spring.presets.smooth, delay: 0.25 }}
        >
          <Link
            href="https://app.folo.is"
            target="_blank"
            rel="noreferrer noopener"
            className={cx(
              'group block rounded-xl border border-border bg-material-medium/40 backdrop-blur p-6 transition-all duration-200',
              'hover:bg-material-medium/60 hover:shadow-md',
              focusRing,
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <m.i
                  className="i-mingcute-globe-2-line size-8 text-text-secondary group-hover:text-accent transition-colors"
                  aria-hidden
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                />
                <div>
                  <h3 className="text-lg font-semibold text-text">
                    {webTitle}
                  </h3>
                  <p className="text-sm text-text-secondary">{webSubtitle}</p>
                </div>
              </div>
              <m.i
                className="i-mingcute-arrow-right-line size-6 text-text-secondary group-hover:text-accent transition-colors"
                aria-hidden
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </Link>
        </m.div>

        <m.p
          className="mt-12 text-center text-sm text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {footer}
        </m.p>
      </div>
    </section>
  )
}

const DownloadChannelCard = ({
  channel,
}: {
  channel: PlatformDownloadChannel
}) => {
  return (
    <Link
      href={channel.href}
      target="_blank"
      rel="noreferrer noopener"
      className={cx(
        'group block rounded-xl border border-border bg-material-medium/60 backdrop-blur p-6 transition-all duration-200',
        'hover:bg-material-thick/70 hover:shadow-lg hover:scale-[1.01]',
        focusRing,
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h4 className="mt-1 truncate text-lg font-semibold text-text">
            {channel.name}
          </h4>
        </div>

        <m.i
          className="i-mingcute-download-2-line size-6 shrink-0 text-text-secondary group-hover:text-accent transition-colors"
          aria-hidden
          whileHover={{ y: 2 }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </Link>
  )
}
