import { useScrollMarkReadGracePeriod } from "@follow/hooks"
import * as React from "react"
import { act } from "react"
import type { Root } from "react-dom/client"
import { createRoot } from "react-dom/client"
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest"

describe("useScrollMarkReadGracePeriod", () => {
  let root: Root | null = null
  let container: HTMLElement | null = null

  beforeAll(() => {
    ;(globalThis as typeof globalThis & { React: typeof React }).React = React
    ;(
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount()
      })
    }

    vi.useRealTimers()
    container?.remove()
    root = null
    container = null
  })

  test("pauses briefly when the pause key changes", async () => {
    vi.useFakeTimers()
    const values: boolean[] = []

    const Consumer = ({ pauseKey }: { pauseKey: string }) => {
      const paused = useScrollMarkReadGracePeriod(false, 1000, pauseKey)

      React.useEffect(() => {
        values.push(paused)
      }, [paused])

      return null
    }

    container = document.createElement("div")
    document.body.append(container)
    root = createRoot(container)

    await act(async () => {
      root?.render(<Consumer pauseKey="articles" />)
    })

    expect(values.at(-1)).toBe(false)

    await act(async () => {
      root?.render(<Consumer pauseKey="social-media" />)
    })

    expect(values.at(-1)).toBe(true)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    expect(values.at(-1)).toBe(false)
  })
})
