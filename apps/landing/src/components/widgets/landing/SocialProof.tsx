import { useTranslations } from 'next-intl'
import * as React from 'react'

import { GridGuides } from '~/components/ui/effects/GridGuides'
import { MagicCard } from '~/components/ui/magic-card'

const tweetList = [
  {
    id: '1833056589135442345',
    text: "Very nice news aggregation. So far I just try move front end people I followed in, haven't done yet, will try move more rss subscribe.",
    name: '🦋 AnneInCoding',
    screenName: '@anneincoding',
    profileImageUrl:
      'https://pbs.twimg.com/profile_images/1785961711150960640/33lS68gu_normal.jpg',
  },
  {
    id: '1832896505528930551',
    text: 'Folo is sick!!!! It is indeed the best RSS app on this planet, way better than any pure RSS app such as Reeder, Inoreader, or any apps with RSS features like Readwise Reader!!!',
    name: "Poor Delmar's Handbook",
    screenName: '@delmarshandbook',
    profileImageUrl:
      'https://pbs.twimg.com/profile_images/1351213836100120579/x-n-YSQR_normal.jpg',
  },
  {
    id: '1832725192860393593',
    text: 'Thanks for making information such a pleasant thing.',
    name: '$H!NDGEKYUME',
    screenName: '@shindgewongxj',
    profileImageUrl:
      'https://pbs.twimg.com/profile_images/1926131191217840128/TzsBgEv-_normal.png',
  },
  {
    id: '1819361867359535603',
    text: "Just switched my RSS reader to Folo and it's a game-changer! The built-in AI summaries are saving me so much time. If you're drowning in feeds, this app might be your new best friend.",
    name: 'runes780',
    screenName: '@runes780',
    profileImageUrl:
      'https://pbs.twimg.com/profile_images/815928464150700032/1FJAoURS_normal.jpg',
  },

  {
    id: '1818653250381574206',
    text: "Awesome! I'm using it too.",
    name: 'MingCute',
    screenName: '@MingCute_icon',
    profileImageUrl:
      'https://pbs.twimg.com/profile_images/1785665962752233472/vU2SVqok_normal.jpg',
  },
  {
    id: 'manual-1',
    text: "I'm really enjoying it so far... it's super smooth and gorgeous. It being multiplatform is amazing, cuz there's literally zero good rss apps for windows.",
    name: '@adamfergusonart',
    screenName: 'Adam',
    profileImageUrl:
      'https://pbs.twimg.com/profile_images/1787910265876500480/RfnkdD9r_400x400.jpg',
  },
]

export const SocialProof: Component = () => {
  const socialT = useTranslations('landing.socialProof')
  const actionsT = useTranslations('common.actions')
  const spans = [
    'md:col-span-3 lg:col-span-4',
    'md:col-span-3 lg:col-span-4',
    'md:col-span-3 lg:col-span-4',
    'md:col-span-3 lg:col-span-4',
    'md:col-span-3 lg:col-span-4',
  ] as const

  const getTweetUrl = (tweet: (typeof tweetList)[number]) => {
    if (tweet.id.startsWith('manual-')) return '#'
    return `https://twitter.com/${tweet.screenName.replace('@', '')}/status/${tweet.id}`
  }

  return (
    <section
      id="social"
      className="relative z-[1] mx-auto mt-28 w-full max-w-[var(--container-max-width-2xl)] px-4 md:mt-32 lg:mt-40"
    >
      <GridGuides />

      <header className="mx-auto max-w-5xl">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/80 bg-material-medium/60 px-3 py-1 text-[11px] font-medium text-text-secondary backdrop-blur">
          <i className="i-lucide-heart text-accent" aria-hidden />
          {socialT('eyebrow')}
        </p>
        <h2 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {socialT('headline')}
        </h2>
      </header>

      {/* Masonry-style grid with variable spans */}
      <div className="mt-8 grid grid-cols-1 auto-rows-auto gap-4 md:grid-cols-6 lg:grid-cols-12">
        {tweetList.map((tweet, idx) => (
          <MagicCard
            key={tweet.id}
            className={`${spans[idx % spans.length]} rounded-2xl h-full`}
            gradientSize={240}
            gradientFrom="#ff5c00"
            gradientTo="#ff3e03"
            gradientColor="#1111"
            gradientOpacity={0.1}
          >
            <article className="flex h-full flex-col p-6">
              {/* Header with profile */}
              <header className="mb-4 flex items-start gap-3">
                <img
                  src={tweet.profileImageUrl}
                  alt={`${tweet.name} profile`}
                  className="size-10 shrink-0 rounded-full border border-border/50"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">
                    {tweet.name}
                  </p>
                  <p className="truncate text-xs text-text-tertiary">
                    {tweet.screenName}
                  </p>
                </div>
                <i
                  className="i-mingcute-twitter-line shrink-0 text-lg text-text-tertiary/60"
                  aria-hidden
                />
              </header>

              {/* Tweet content */}
              <blockquote className="flex-1 text-pretty text-[13px] leading-relaxed text-text-secondary">
                {tweet.text}
              </blockquote>

              {/* Footer with link */}
              {!tweet.id.startsWith('manual-') && (
                <footer className="mt-4 pt-4 border-t border-border/30">
                  <a
                    href={getTweetUrl(tweet)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary transition-colors hover:text-accent"
                  >
                    {actionsT('viewOnTwitter')}
                    <i
                      className="i-lucide-arrow-up-right text-sm"
                      aria-hidden
                    />
                  </a>
                </footer>
              )}
            </article>
          </MagicCard>
        ))}
      </div>
    </section>
  )
}

SocialProof.displayName = 'SocialProof'
