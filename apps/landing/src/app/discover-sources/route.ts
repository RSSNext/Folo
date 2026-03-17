import type { RSSHubRoutesIndex } from '~/lib/landing-data'
import {
  buildDiscoverSourcesFromIndex,
  DISCOVER_FALLBACK,
  PRODUCTION_RSSHUB_ROUTES_URL,
} from '~/lib/landing-data'

const CACHE_TTL_MS = 12 * 60 * 60 * 1000

let cached:
  | {
      expiresAt: number
      data: ReturnType<typeof buildDiscoverSourcesFromIndex>
    }
  | undefined

export async function GET() {
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return Response.json(cached.data, {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    })
  }

  try {
    const response = await fetch(PRODUCTION_RSSHUB_ROUTES_URL, {
      headers: {
        accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch RSSHub routes: ${response.status}`)
    }

    const result = (await response.json()) as RSSHubRoutesIndex
    const data = buildDiscoverSourcesFromIndex(result)

    cached = {
      data,
      expiresAt: now + CACHE_TTL_MS,
    }

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    })
  } catch {
    return Response.json(DISCOVER_FALLBACK, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
}
