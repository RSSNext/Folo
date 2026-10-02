import { afterEach, describe, expect, it, vi } from 'vitest'

import { TRUSTED_RESEARCH_INSTITUTIONS } from './landing-data'

describe('TRUSTED_RESEARCH_INSTITUTIONS', () => {
  it('keeps the QS-sorted top 10 institutions stable', () => {
    expect(TRUSTED_RESEARCH_INSTITUTIONS).toHaveLength(10)
    expect(TRUSTED_RESEARCH_INSTITUTIONS.map((item) => item.name)).toEqual([
      'MIT',
      'Stanford',
      'Oxford',
      'Harvard',
      'Cambridge',
      'NUS',
      'UCL',
      'NTU Singapore',
      'Peking University',
      'UPenn',
    ])
  })
})

describe('landing data request deadlines', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('renders fallback hero and metrics when upstream requests stall', async () => {
    vi.useFakeTimers()
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) => {
            options.signal?.addEventListener(
              'abort',
              () => {
                reject(new DOMException('Request aborted', 'AbortError'))
              },
              { once: true },
            )
          }),
      ),
    )

    const data = await import('./landing-data')
    const result = Promise.all([
      data.getHeroTimelineItems('en'),
      data.getLandingMetrics(),
    ])
    await vi.advanceTimersByTimeAsync(5000)

    const [heroItems, metrics] = await result
    expect(heroItems.length).toBeGreaterThanOrEqual(8)
    expect(heroItems[0]).toMatchObject({
      title: 'OpenAI News',
      href: 'https://openai.com/news',
    })
    expect(metrics.entries).toBeGreaterThan(0)
    expect(metrics.feeds).toBeGreaterThan(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears the deadline after a successful response', async () => {
    vi.useFakeTimers()
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const data = await import('./landing-data')
    const metrics = { entries: 123, feeds: 45 }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ data: metrics })),
    )

    expect(await data.getLandingMetrics()).toEqual(metrics)
    expect(vi.getTimerCount()).toBe(0)
  })
})
