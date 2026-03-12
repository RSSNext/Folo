'use client'

import { m } from 'motion/react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { PlatformStoreLinkMap } from '~/constants/download'
import { Link as LocalizedLink } from '~/i18n/routing'
import { cx, focusRing } from '~/lib/cn'
import { Spring } from '~/lib/spring'

type OS = 'macOS' | 'Windows' | 'Linux'

type PlatformOption = {
  os: OS
  label: string
  icon: string
  storeLink: string
  storeName: string
}

const allPlatforms: PlatformOption[] = [
  {
    os: 'macOS',
    label: 'macOS',
    icon: 'i-simple-icons-apple',
    storeLink: PlatformStoreLinkMap.macOS.link,
    storeName: PlatformStoreLinkMap.macOS.name,
  },
  {
    os: 'Windows',
    label: 'Windows',
    icon: 'i-simple-icons-windows',
    storeLink: PlatformStoreLinkMap.Windows.link,
    storeName: PlatformStoreLinkMap.Windows.name,
  },
  {
    os: 'Linux',
    label: 'Linux',
    icon: 'i-simple-icons-linux',
    storeLink: PlatformStoreLinkMap.Linux.link,
    storeName: PlatformStoreLinkMap.Linux.name,
  },
]

export const PlatformDownloads: Component<{
  detectedOS: OS | null
}> = ({ detectedOS }) => {
  const platformT = useTranslations('download.platforms')
  const platformsToShow = detectedOS
    ? allPlatforms.filter((p) => p.os === detectedOS)
    : allPlatforms
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
      <div className="mx-auto max-w-3xl">
        {/* Main Download Links */}
        <m.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
        >
          {platformsToShow.map((platform) => (
            <m.div
              key={platform.os}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={Spring.presets.smooth}
            >
              <Link
                href={platform.storeLink}
                target="_blank"
                rel="noreferrer noopener"
                className={cx(
                  'group block rounded-xl border border-border bg-material-medium/60 backdrop-blur p-6 transition-all duration-200',
                  'hover:bg-material-thick/70 hover:shadow-lg hover:scale-[1.01]',
                  focusRing,
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <m.i
                      className={cx(platform.icon, 'size-8 text-accent')}
                      aria-hidden
                      whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.3 }}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-text">
                        {platformT(`${platform.os}.label`, {
                          defaultValue: platform.label,
                        })}
                      </h3>
                      <p className="text-sm text-text-secondary">
                        {platformT(`${platform.os}.store`, {
                          defaultValue: platform.storeName,
                        })}
                      </p>
                    </div>
                  </div>
                  <m.i
                    className="i-mingcute-download-2-line size-6 text-text-secondary group-hover:text-accent transition-colors"
                    aria-hidden
                    whileHover={{ y: 2 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </Link>
            </m.div>
          ))}
        </m.div>

        {/* Web Version */}
        <m.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...Spring.presets.smooth, delay: 0.3 }}
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

        {/* Show all platforms */}
        {/* {detectedOS && (
          <div className="mt-8 text-center">
            <button
              type="button"
              className={cx(
                'text-sm text-text-secondary hover:text-text transition-colors inline-flex items-center gap-1',
                focusRing,
              )}
            >
              Show all platforms
              <i className="i-mingcute-down-line" aria-hidden />
            </button>
          </div>
        )} */}

        {/* Footer Note */}
        <m.p
          className="mt-12 text-center text-sm text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {footer}
        </m.p>
      </div>
    </section>
  )
}
