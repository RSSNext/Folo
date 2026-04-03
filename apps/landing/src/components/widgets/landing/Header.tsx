'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LinearBlur } from 'progressive-blur'

import { useIsMobile } from '~/atoms'
import { Folo } from '~/components/brand/Folo'
import { Logo } from '~/components/brand/Logo'
import { Button } from '~/components/ui/button/Button'
import { GlassSurface } from '~/components/ui/glass'
import { Link as LocalizedLink } from '~/i18n/routing'
import { cn } from '~/lib/cn'
import { usePageScrollLocationSelector } from '~/providers/root/page-scroll-info-provider'

export const LandingHeader: Component = () => {
  // const { data: githubStars } = useGithubStar()

  // const formatStars = (n?: number) =>
  //   typeof n === 'number' && n >= 0 ? n.toLocaleString('en-US') : 'GitHub'

  const isMobile = useIsMobile()
  const isOverflowPage = usePageScrollLocationSelector((s) => s > 100)
  const actionsT = useTranslations('common.actions')
  const navItems = [
    { label: 'Download', href: '/download' },
    { label: 'Pricing', href: '/pricing' },
  ] as const

  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <LinearBlur className="absolute top-0 inset-x-0 h-16 z-[-1]" />

      <div className="mx-auto w-full max-w-5xl relative">
        <nav
          aria-label="Primary"
          className="flex items-center justify-between px-3 lg:h-20 relative h-16 lg:-mx-6"
        >
          {!isMobile && (
            <GlassSurface
              blueOffset={20}
              blur={10}
              backgroundOpacity={0.5}
              displace={5}
              className={cn(
                'absolute left-0 top-[10px] z-[-1] transition-opacity duration-300',
                !isOverflowPage && 'opacity-0',
              )}
              borderRadius={9999}
              height={60}
              width={'100%'}
            />
          )}

          {isMobile && (
            <div
              className={cn(
                'absolute left-0 top-0 z-[-1] transition-opacity duration-300 backdrop-blur-background h-16 w-full border-b border-border',
                !isOverflowPage && 'opacity-0',
              )}
            />
          )}
          <div className="flex items-center gap-8">
            <LocalizedLink href="/" className="flex items-center gap-2 ml-4">
              <Logo width={26} height={26} aria-hidden accentColor="#FF5C00" />

              <Folo className="size-8" />
            </LocalizedLink>

            <ul className="hidden items-center gap-5 md:flex">
              {navItems.map((item) => (
                <li key={item.href}>
                  <LocalizedLink
                    href={item.href}
                    className="text-sm text-text-secondary transition-colors hover:text-text"
                  >
                    {item.label}
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* <Link
              href="https://github.com/RSSNext/Folo"
              target="_blank"
              rel="noreferrer noopener"
              className={cx(
                'hidden md:inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                'border-border bg-background text-text hover:bg-fill-secondary',
              )}
              aria-label="Star Folo on GitHub"
            >
              <i className="i-simple-icons-github size-4" aria-hidden />
              <span className="whitespace-nowrap">GitHub Stars</span>
              <i
                className="i-mingcute-star-fill text-[oklch(var(--color-yellow-60))]"
                aria-hidden
              />
              <span className="tabular-nums">{formatStars(githubStars)}</span>
            </Link> */}

            <Link
              href="https://app.folo.is"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Button size="md" className="px-4 py-2">
                {actionsT('getStarted')}
              </Button>
            </Link>

            {/* Mobile hamburger */}
            {/* <PresentSheet
              title=""
              content={
                <MobileMenuContent
                  githubStarsLabel={formatStars(githubStars)}
                />
              }
            >
              <button
                type="button"
                aria-label="Open menu"
                className={cx(
                  'md:hidden inline-flex items-center justify-center rounded-full border border-border bg-material-medium/60 p-2',
                  focusRing,
                )}
              >
                <i className="i-mingcute-menu-line size-4" aria-hidden />
              </button>
            </PresentSheet> */}
          </div>
        </nav>
      </div>
    </div>
  )
}

LandingHeader.displayName = 'LandingHeader'

// function MobileMenuContent({ githubStarsLabel }: { githubStarsLabel: string }) {
//   return (
//     <div className="space-y-4">
//       <nav className="flex flex-col gap-2">
//         {NAV_ITEMS.map((item) => (
//           <a
//             key={item.id}
//             href={`#${item.id}`}
//             className="rounded-lg px-3 py-2 text-sm text-text hover:bg-fill"
//           >
//             {item.label}
//           </a>
//         ))}
//       </nav>

//       <div className="h-px bg-border" />

//       <div className="flex flex-col gap-3">
//         <Link
//           href="https://github.com/RSSNext/Folo"
//           target="_blank"
//           rel="noreferrer noopener"
//           className={cx(
//             'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
//             'border-border bg-background text-text hover:bg-fill-secondary',
//           )}
//           aria-label="Star Folo on GitHub"
//         >
//           <i className="i-simple-icons-github size-4" aria-hidden />
//           <span className="whitespace-nowrap">GitHub Stars</span>
//           <i
//             className="i-mingcute-star-fill text-[oklch(var(--color-yellow-60))]"
//             aria-hidden
//           />
//           <span className="tabular-nums">{githubStarsLabel}</span>
//         </Link>

//         <Link
//           href="https://app.folo.is"
//           target="_blank"
//           rel="noreferrer noopener"
//           className="relative w-full flex"
//           legacyBehavior
//         >
//           <Button className="flex">Download</Button>
//         </Link>
//       </div>
//     </div>
//   )
// }
