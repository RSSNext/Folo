import { afterEach, describe, expect, it, vi } from 'vitest'

describe('discover sources route', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('returns a short-lived fallback when the upstream stalls and retries next time', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(
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
    )
    vi.stubGlobal('fetch', fetchMock)
    const { GET } = await import('./route')
    const { DISCOVER_FALLBACK } = await import('~/lib/landing-data')

    for (let attempt = 0; attempt < 2; attempt++) {
      const pending = GET()
      await vi.advanceTimersByTimeAsync(5000)
      const response = await pending
      expect(response.status).toBe(200)
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=60')
      expect(await response.json()).toEqual(DISCOVER_FALLBACK)
    }

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('caches successful route data and releases the request deadline', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({
        example: {
          name: 'Example',
          url: 'example.com',
          heat: 42,
          categories: ['programming'],
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const { GET } = await import('./route')

    const first = await GET()
    const firstData = await first.json()
    expect(firstData).toEqual([
      {
        key: 'example',
        name: 'Example',
        host: 'example.com',
        heat: 42,
        categories: ['programming'],
      },
    ])
    expect(first.headers.get('Cache-Control')).toBe('public, max-age=600')
    expect(await (await GET()).json()).toEqual(firstData)
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
})
