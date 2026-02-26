'use client'

import Link from 'next/link'

import { Logo } from '~/components/brand/Logo'
import { cx, focusRing } from '~/lib/cn'

type LinkItem = { label: string; href: string; external?: boolean }

const productLinks: LinkItem[] = [
  { label: 'Web App', href: 'https://app.folo.is', external: true },
  { label: 'Download', href: '/download', external: false },
]

const communityLinks: LinkItem[] = [
  { label: 'Discord', href: 'https://discord.gg/followapp', external: true },
  {
    label: 'GitHub',
    href: 'https://github.com/RSSNext/Folo',
    external: true,
  },
  { label: 'Twitter', href: 'https://x.com/folo_is', external: true },
]

const resourceLinks: LinkItem[] = [
  { label: 'For Researchers', href: '#researchers' },
  { label: 'For Builders', href: '#builders' },
  { label: 'For Creators', href: '#creators' },
  { label: 'For Investors', href: '#investors' },
  // { label: 'API', href: '#api' },
]

const legalLinks: LinkItem[] = [
  { label: 'Privacy Policy', href: 'privacy-policy' },
  { label: 'Terms of Service', href: 'terms-of-service' },
  // { label: 'Security', href: '#security' },
  // { label: 'Cookie', href: '#cookie' },
]

const BrandBlock = () => (
  <div className="max-w-md">
    <Link href="/" className={cx('inline-flex items-center gap-3', focusRing)}>
      <Logo className="size-10 shrink-0" aria-hidden />
      <span className="text-2xl font-semibold tracking-tight">Folo</span>
    </Link>
    <p className="mt-6 text-base leading-relaxed text-text-secondary">
      The next-generation information browser powered by AI. Transform how you
      discover, consume, and interact with content across the web.
    </p>
    <p className="mt-4 text-sm text-text-tertiary">
      Deep reading, contextual AI, and noise-free content discovery — all in one
      beautiful interface.
    </p>
  </div>
)

const Social = () => (
  <div className="mt-6 flex items-center gap-6">
    <Link
      href="https://github.com/RSSNext/Folo"
      target="_blank"
      rel="noreferrer noopener"
      className={cx(
        'inline-flex text-text-secondary transition-colors hover:text-text',
        focusRing,
      )}
      aria-label="GitHub"
    >
      <i className="i-simple-icons-github size-5" aria-hidden />
    </Link>

    <Link
      href="https://x.com/folo_is"
      target="_blank"
      rel="noreferrer noopener"
      className={cx(
        'inline-flex text-text-secondary transition-colors hover:text-text',
        focusRing,
      )}
      aria-label="Twitter / X"
    >
      <i className="i-simple-icons-x size-5" aria-hidden />
    </Link>

    <Link
      href="https://discord.gg/followapp"
      target="_blank"
      rel="noreferrer noopener"
      className={cx(
        'inline-flex text-text-secondary transition-colors hover:text-text',
        focusRing,
      )}
      aria-label="Discord"
    >
      <i className="i-simple-icons-discord size-5" aria-hidden />
    </Link>
  </div>
)

function LinkColumn({ title, links }: { title: string; links: LinkItem[] }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer noopener' : undefined}
              className={cx(
                'text-base text-text-secondary transition-colors hover:text-text',
                focusRing,
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Props for Footer component */
export interface FooterProps {
  className?: string
}

export const Footer: Component<FooterProps> = ({ className }) => {
  const year = new Date().getFullYear()

  return (
    <footer
      className={cx(
        'relative border-t border-border/80 bg-background',
        className,
      )}
      role="contentinfo"
    >
      <div className="relative mx-auto w-full max-w-[var(--container-max-width-2xl)] px-6 py-16 lg:px-8 lg:py-20">
        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand section with stats */}
          <div className="lg:col-span-5">
            <BrandBlock />
            <Social />
          </div>

          {/* Navigation columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <LinkColumn title="Product" links={productLinks} />
            <LinkColumn title="Community" links={communityLinks} />
            <LinkColumn title="Resources" links={resourceLinks} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 sm:flex-row">
          <p className="text-sm text-text-secondary">
            © {year} Folo. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cx(
                  'text-sm text-text-secondary transition-colors hover:text-text',
                  focusRing,
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

Footer.displayName = 'Footer'
