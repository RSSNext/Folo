import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'
import type { HeroTimelineItem } from '~/lib/landing-data'

export const ListDemo = ({
  items = DEFAULT_ITEMS,
}: {
  items?: HeroTimelineItem[]
}) => {
  return (
    <div className="flex flex-col min-w-0 select-none bg-background">
      {items.map((item) => (
        <div
          key={item.title}
          className="group flex min-w-0 max-w-full items-center gap-3 border-b border-border/40 px-4 py-3 transition-colors hover:bg-fill-secondary/80"
        >
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={`https://icons.folo.is/${item.host}`}
              alt={item.title}
              className="size-8 rounded-lg border border-border/60 bg-white/85 p-1"
            />
            <div className="min-w-0 shrink">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="min-w-0 shrink truncate text-sm font-bold">
                  {item.title}
                </h3>
                <span className="shrink-0 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[10px] font-medium text-text-tertiary">
                  {formatCompact(item.subscriptions)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-text-secondary">
                {item.description}
              </p>
            </div>
          </div>

          <p className="min-w-0 flex-1 truncate text-right text-xs text-text-tertiary transition-colors group-hover:text-text-secondary">
            {item.host}
          </p>
        </div>
      ))}
    </div>
  )
}

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formatCompact = (value: number) => compactFormatter.format(value)

const DEFAULT_ITEMS: HeroTimelineItem[] = [
  {
    host: 'openai.com',
    title: 'OpenAI News',
    description: 'The OpenAI blog.',
    href: 'https://openai.com/news',
    subscriptions: 27710,
  },
  {
    host: 'anthropic.com',
    title: 'Anthropic News',
    description: 'Latest news from Anthropic.',
    href: 'https://www.anthropic.com/news',
    subscriptions: 998,
  },
  {
    host: 'github.blog',
    title: 'The GitHub Blog',
    description: 'Updates, ideas, and inspiration from GitHub.',
    href: 'https://github.blog/',
    subscriptions: 24774,
  },
  {
    host: 'nature.com',
    title: 'Nature',
    description: 'Read the latest research articles from Nature.',
    href: 'https://www.nature.com/nature/research-articles',
    subscriptions: 24491,
  },
  {
    host: 'theverge.com',
    title: 'The Verge',
    description: 'Breaking news, reviews, and features about tech.',
    href: 'https://www.theverge.com/',
    subscriptions: 24833,
  },
  {
    host: 'apod.nasa.gov',
    title: 'NASA Astronomy Picture of the Day',
    description: 'The daily image and story from the universe around us.',
    href: 'https://apod.nasa.gov/apod/archivepix.html',
    subscriptions: 29277,
  },
  {
    host: 'lastweekin.ai',
    title: 'Last Week in AI',
    description: 'Weekly text and audio summaries of the biggest AI stories.',
    href: 'https://lastweekin.ai/',
    subscriptions: 30381,
  },
  {
    host: 'magazine.sebastianraschka.com',
    title: 'Ahead of AI',
    description: 'Machine learning and AI research for readers who stay ahead.',
    href: 'https://magazine.sebastianraschka.com/',
    subscriptions: 27310,
  },
  {
    host: 'ted.com',
    title: 'TED Talks Daily',
    description: 'Thought-provoking ideas in audio, delivered every day.',
    href: 'https://www.ted.com/',
    subscriptions: 25784,
  },
  {
    host: 'nytimes.com',
    title: 'The Daily',
    description: 'The biggest stories of our time, told by NYT journalists.',
    href: 'https://www.nytimes.com/the-daily',
    subscriptions: 23638,
  },
  {
    host: 'youtube.com',
    title: '3Blue1Brown',
    description: 'Visual explanations in math, physics, and computer science.',
    href: 'https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw',
    subscriptions: 24897,
  },
  {
    host: 'bsky.app',
    title: 'Bluesky',
    description: 'The official Bluesky account and product updates.',
    href: 'https://bsky.app/profile/bsky.app',
    subscriptions: 24116,
  },
]

export const ListSkeletonDemo = () => {
  const skeletonRows = Array.from(
    { length: 20 },
    (_, index) => `skeleton-${index}`,
  )

  return (
    <div className="flex flex-col min-w-0 relative grow size-full">
      <div className="absolute inset-0">
        <ScrollArea rootClassName="size-full">
          {skeletonRows.map((key) => (
            <div
              key={key}
              className="py-3 pl-4 min-w-0 flex truncate max-w-full hover:bg-material-medium"
            >
              <div className="flex items-center gap-2 grow">
                <div className="size-4 rounded-md bg-fill-secondary" />
                <div className="flex flex-row grow items-center gap-2">
                  <h3 className="text-sm font-bold min-w-0 shrink flex-2 truncate">
                    <div className="w-full h-4 rounded-md bg-fill-secondary" />
                  </h3>
                  <div className="text-sm text-text-secondary min-w-0 truncate mr-2">
                    <div className="w-12 h-4 rounded-md bg-fill-secondary" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  )
}
