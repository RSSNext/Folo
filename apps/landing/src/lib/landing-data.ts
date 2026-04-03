const PRODUCTION_API_URL = 'https://api.follow.is'
export const PRODUCTION_RSSHUB_ROUTES_URL =
  'https://docs.rsshub.app/routes.json'
const isDevelopment = process.env.NODE_ENV !== 'production'

const HERO_ITEM_LIMIT = 12

const HERO_HOST_LIMITS: Record<string, number> = {
  'youtube.com': 1,
  'x.com': 1,
}

export type HeroTimelineItem = {
  title: string
  description: string
  host: string
  href: string
  subscriptions: number
}

export type DiscoverSource = {
  key: string
  name: string
  host: string
  heat: number
  categories: string[]
}

export type TrustedCompany = {
  name: string
  host: string
  users: number
}

export type LandingMetrics = {
  feeds: number
  entries: number
}

type TrendingFeedsResponse = {
  code: number
  data: Array<{
    feed: {
      title: string
      description?: string | null
      siteUrl?: string | null
      url: string
    }
    analytics: {
      subscriptionCount: number
    }
  }>
}

export type RSSHubRoutesIndex = Record<
  string,
  {
    name: string
    url: string
    heat?: number
    categories?: string[]
  }
>

type LandingMetricsResponse = {
  code: number
  data: LandingMetrics
}

const HERO_FALLBACK: HeroTimelineItem[] = [
  {
    title: 'OpenAI News',
    description: 'The OpenAI blog.',
    host: 'openai.com',
    href: 'https://openai.com/news',
    subscriptions: 27710,
  },
  {
    title: 'Anthropic News',
    description: 'Latest news from Anthropic.',
    host: 'anthropic.com',
    href: 'https://www.anthropic.com/news',
    subscriptions: 998,
  },
  {
    title: 'The GitHub Blog',
    description:
      'Updates, ideas, and inspiration from GitHub to help developers build and design software.',
    host: 'github.blog',
    href: 'https://github.blog/',
    subscriptions: 24774,
  },
  {
    title: 'Nature',
    description: 'Read the latest research articles from Nature.',
    host: 'nature.com',
    href: 'https://www.nature.com/nature/research-articles',
    subscriptions: 24491,
  },
  {
    title: 'The Verge',
    description:
      'Breaking news, reviews, and features about how technology changes the world.',
    host: 'theverge.com',
    href: 'https://www.theverge.com/',
    subscriptions: 24833,
  },
  {
    title: 'NASA Astronomy Picture of the Day',
    description: 'The daily image and story from the universe around us.',
    host: 'apod.nasa.gov',
    href: 'https://apod.nasa.gov/apod/archivepix.html',
    subscriptions: 29277,
  },
  {
    title: 'Last Week in AI',
    description:
      'Weekly text and audio summaries of the most important AI stories.',
    host: 'lastweekin.ai',
    href: 'https://lastweekin.ai/',
    subscriptions: 30381,
  },
  {
    title: 'Ahead of AI',
    description:
      'Machine learning and AI research for readers who want to stay ahead.',
    host: 'magazine.sebastianraschka.com',
    href: 'https://magazine.sebastianraschka.com/',
    subscriptions: 27310,
  },
  {
    title: 'TED Talks Daily',
    description: 'Thought-provoking ideas in audio, delivered every day.',
    host: 'ted.com',
    href: 'https://www.ted.com/',
    subscriptions: 25784,
  },
  {
    title: 'The Daily',
    description:
      'The biggest stories of our time, told by New York Times journalists.',
    host: 'nytimes.com',
    href: 'https://www.nytimes.com/the-daily',
    subscriptions: 23638,
  },
  {
    title: '3Blue1Brown',
    description: 'Visual explanations in math, physics, and computer science.',
    host: 'youtube.com',
    href: 'https://www.youtube.com/channel/UCYO_jab_esuFRV4b17AJtAw',
    subscriptions: 24897,
  },
  {
    title: 'Bluesky',
    description: 'The official Bluesky account and product updates.',
    host: 'bsky.app',
    href: 'https://bsky.app/profile/bsky.app',
    subscriptions: 24116,
  },
]

export const DISCOVER_FALLBACK: DiscoverSource[] = [
  {
    key: 'xiaohongshu',
    name: 'Xiaohongshu',
    host: 'xiaohongshu.com',
    heat: 1413942,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'twitter',
    name: 'X',
    host: 'x.com',
    heat: 1269331,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'telegram',
    name: 'Telegram',
    host: 't.me',
    heat: 285958,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'youtube',
    name: 'YouTube',
    host: 'youtube.com',
    heat: 278462,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'bilibili',
    name: 'bilibili',
    host: 'bilibili.com',
    heat: 214649,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'weibo',
    name: 'Weibo',
    host: 'weibo.com',
    heat: 59600,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'xiaoyuzhou',
    name: 'Xiaoyuzhou',
    host: 'xiaoyuzhoufm.com',
    heat: 51947,
    categories: ['multimedia', 'popular'],
  },
  {
    key: 'pixiv',
    name: 'pixiv',
    host: 'pixiv.net',
    heat: 48311,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'github',
    name: 'GitHub',
    host: 'github.com',
    heat: 45308,
    categories: ['programming', 'popular'],
  },
  {
    key: 'sspai',
    name: 'SSPAI',
    host: 'sspai.com',
    heat: 34311,
    categories: ['new-media', 'popular'],
  },
  {
    key: 'jike',
    name: 'Jike',
    host: 'm.okjike.com',
    heat: 32042,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'nasa',
    name: 'NASA',
    host: 'apod.nasa.gov',
    heat: 29994,
    categories: ['picture', 'popular'],
  },
  {
    key: 'nature',
    name: 'Nature',
    host: 'nature.com',
    heat: 26324,
    categories: ['journal', 'popular'],
  },
  {
    key: 'zhihu',
    name: 'Zhihu',
    host: 'zhihu.com',
    heat: 26633,
    categories: ['social-media', 'popular'],
  },
  {
    key: '36kr',
    name: '36Kr',
    host: '36kr.com',
    heat: 18922,
    categories: ['new-media', 'popular'],
  },
  {
    key: 'juejin',
    name: 'Juejin',
    host: 'juejin.cn',
    heat: 12318,
    categories: ['programming', 'popular'],
  },
  {
    key: 'bsky',
    name: 'Bluesky',
    host: 'bsky.app',
    heat: 25232,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'threads',
    name: 'Threads',
    host: 'threads.net',
    heat: 24696,
    categories: ['social-media', 'popular'],
  },
  {
    key: 'nytimes',
    name: 'The New York Times',
    host: 'nytimes.com',
    heat: 8922,
    categories: ['traditional-media', 'popular'],
  },
  {
    key: 'reuters',
    name: 'Reuters',
    host: 'reuters.com',
    heat: 5915,
    categories: ['traditional-media', 'popular'],
  },
  {
    key: 'bloomberg',
    name: 'Bloomberg',
    host: 'bloomberg.com',
    heat: 5339,
    categories: ['finance', 'popular'],
  },
  {
    key: 'huggingface',
    name: 'Hugging Face',
    host: 'huggingface.co',
    heat: 3219,
    categories: ['programming', 'popular'],
  },
  {
    key: 'spotify',
    name: 'Spotify',
    host: 'open.spotify.com',
    heat: 2948,
    categories: ['multimedia', 'popular'],
  },
  {
    key: 'rsshub',
    name: 'RSSHub',
    host: 'docs.rsshub.app',
    heat: 12237,
    categories: ['program-update', 'popular'],
  },
]

export const TRUSTED_COMPANIES: TrustedCompany[] = [
  { name: 'Alibaba', host: 'aliyun.com', users: 281 },
  { name: 'ByteDance', host: 'bytedance.com', users: 107 },
  { name: 'Mozilla', host: 'mozmail.com', users: 85 },
  { name: 'Tencent', host: 'tencent.com', users: 18 },
  { name: 'Microsoft', host: 'microsoft.com', users: 12 },
  { name: 'Google', host: 'google.com', users: 9 },
  { name: 'Baidu', host: 'baidu.com', users: 7 },
  { name: 'Xiaomi', host: 'xiaomi.com', users: 7 },
  { name: 'Huawei', host: 'huawei.com', users: 5 },
  { name: 'NVIDIA', host: 'nvidia.com', users: 4 },
]

export const TRUSTED_RESEARCH_INSTITUTIONS: TrustedCompany[] = [
  { name: 'MIT', host: 'mit.edu', users: 1 },
  { name: 'Stanford', host: 'stanford.edu', users: 2 },
  { name: 'Oxford', host: 'ox.ac.uk', users: 1 },
  { name: 'Harvard', host: 'harvard.edu', users: 4 },
  { name: 'Cambridge', host: 'cam.ac.uk', users: 1 },
  { name: 'NUS', host: 'nus.edu.sg', users: 11 },
  { name: 'UCL', host: 'ucl.ac.uk', users: 2 },
  { name: 'NTU Singapore', host: 'ntu.edu.sg', users: 6 },
  { name: 'Peking University', host: 'pku.edu.cn', users: 41 },
  { name: 'UPenn', host: 'upenn.edu', users: 5 },
]

const LANDING_METRICS_FALLBACK: LandingMetrics = {
  feeds: 1267577,
  entries: 300849952,
}

const truncate = (value: string, maxLength: number) =>
  value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1).trimEnd()}…`

const normalizeHost = (raw: string | null | undefined) => {
  if (!raw) return null

  try {
    const url = raw.startsWith('http')
      ? new URL(raw)
      : new URL(`https://${raw}`)
    return url.host.replace(/^www\./, '')
  } catch {
    return null
  }
}

const normalizeDescription = (value: string | null | undefined) => {
  const cleaned = (value || '')
    .replace(/\s+- Powered by RSSHub$/i, '')
    .replaceAll(/\s+/g, ' ')
    .trim()

  return cleaned
    ? truncate(cleaned, 96)
    : 'Fresh signal from a source that is trending inside production Folo timelines.'
}

const fetchJson = async <T>(url: string) => {
  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }

  return (await response.json()) as T
}

const getTrendingLanguage = (locale?: string) =>
  locale === 'zh' ? 'cmn' : 'eng'

export const buildDiscoverSourcesFromIndex = (
  result: RSSHubRoutesIndex,
): DiscoverSource[] => {
  const uniqueByHost = new Map<string, DiscoverSource>()

  for (const [key, value] of Object.entries(result)) {
    const host = normalizeHost(value.url) || value.url
    if (!host) continue

    const nextItem = {
      key,
      name: value.name,
      host,
      heat: value.heat ?? 0,
      categories: value.categories ?? [],
    }

    const existing = uniqueByHost.get(host)
    if (!existing || nextItem.heat > existing.heat) {
      uniqueByHost.set(host, nextItem)
    }
  }

  return Array.from(uniqueByHost.values()).sort(
    (left, right) =>
      right.heat - left.heat || left.name.localeCompare(right.name),
  )
}

export const getHeroTimelineItems = async (
  locale?: string,
): Promise<HeroTimelineItem[]> => {
  if (isDevelopment) {
    return HERO_FALLBACK
  }

  try {
    const language = getTrendingLanguage(locale)
    const result = await fetchJson<TrendingFeedsResponse>(
      `${PRODUCTION_API_URL}/trending/feeds?range=30d&limit=40&language=${language}`,
    )

    const hostUsage = new Map<string, number>()
    const items: HeroTimelineItem[] = []

    for (const entry of result.data) {
      const host = normalizeHost(entry.feed.siteUrl || entry.feed.url)
      if (!host) continue

      const currentCount = hostUsage.get(host) ?? 0
      const maxCount = HERO_HOST_LIMITS[host] ?? 1
      if (currentCount >= maxCount) continue

      items.push({
        title: truncate(entry.feed.title.trim(), 44),
        description: normalizeDescription(entry.feed.description),
        host,
        href: entry.feed.siteUrl || entry.feed.url,
        subscriptions: entry.analytics.subscriptionCount,
      })

      hostUsage.set(host, currentCount + 1)

      if (items.length >= HERO_ITEM_LIMIT) {
        break
      }
    }

    return items.length >= 8 ? items : HERO_FALLBACK
  } catch (error) {
    console.error('Failed to load landing hero timeline items', error)
    return HERO_FALLBACK
  }
}

export const getDiscoverSources = async (): Promise<DiscoverSource[]> => {
  try {
    const result = await fetchJson<RSSHubRoutesIndex>(
      PRODUCTION_RSSHUB_ROUTES_URL,
    )
    const items = buildDiscoverSourcesFromIndex(result)

    return items.length >= 8 ? items : DISCOVER_FALLBACK
  } catch (error) {
    console.error('Failed to load landing discover sources', error)
    return DISCOVER_FALLBACK
  }
}

export const getLandingMetrics = async (): Promise<LandingMetrics> => {
  if (isDevelopment) {
    return LANDING_METRICS_FALLBACK
  }

  try {
    const result = await fetchJson<LandingMetricsResponse>(
      `${PRODUCTION_API_URL}/status/landing-metrics`,
    )
    return result.data
  } catch (error) {
    console.error('Failed to load landing metrics', error)
    return LANDING_METRICS_FALLBACK
  }
}
