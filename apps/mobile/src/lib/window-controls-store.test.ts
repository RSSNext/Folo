import { describe, expect, it, vi } from "vitest"

import type { WindowControlsInsets, WindowControlsInsetsSource } from "./window-controls-store"
import { createWindowControlsInsetsStore } from "./window-controls-store"

type InsetsListener = (insets: WindowControlsInsets) => void

const createSource = (initial: WindowControlsInsets) => {
  let emit: InsetsListener | undefined
  let answer: InsetsListener | undefined
  const source = {
    getWindowControlsInsets: vi.fn(
      () =>
        new Promise<WindowControlsInsets>((resolve) => {
          answer = resolve
        }),
    ),
    addListener: vi.fn((_eventName: "onWindowControlsInsetsChange", listener: InsetsListener) => {
      emit = listener
      return { remove: vi.fn() }
    }),
  } satisfies WindowControlsInsetsSource
  return {
    source,
    emit: (insets: WindowControlsInsets) => emit?.(insets),
    answer: async (insets: WindowControlsInsets = initial) => {
      answer?.(insets)
      await Promise.resolve()
    },
  }
}

describe("createWindowControlsInsetsStore", () => {
  it("stays empty without the native side", () => {
    const store = createWindowControlsInsetsStore(null)
    const listener = vi.fn()

    store.subscribe(listener)

    expect(store.getSnapshot()).toEqual({ left: 0, right: 0 })
    expect(listener).not.toHaveBeenCalled()
  })

  it("asks the native side once the first component subscribes, then follows its changes", async () => {
    const { source, emit, answer } = createSource({ left: 62, right: 0 })
    const store = createWindowControlsInsetsStore(source)
    expect(source.getWindowControlsInsets).not.toHaveBeenCalled()

    const listener = vi.fn()
    store.subscribe(listener)
    store.subscribe(vi.fn())
    expect(source.getWindowControlsInsets).toHaveBeenCalledOnce()
    expect(source.addListener).toHaveBeenCalledOnce()

    await answer()
    expect(store.getSnapshot()).toEqual({ left: 62, right: 0 })
    expect(listener).toHaveBeenCalledOnce()

    // Maximizing the window takes the controls out of the content
    emit({ left: 0, right: 0 })
    expect(store.getSnapshot()).toEqual({ left: 0, right: 0 })
    // The same insets again change nothing
    emit({ left: 0, right: 0 })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it("keeps a change that arrived before the answer to the first question", async () => {
    const { source, emit, answer } = createSource({ left: 62, right: 0 })
    const store = createWindowControlsInsetsStore(source)
    store.subscribe(vi.fn())

    emit({ left: 0, right: 0 })
    await answer()

    expect(store.getSnapshot()).toEqual({ left: 0, right: 0 })
  })

  it("leaves builds without the native function alone", () => {
    const addListener = vi.fn()
    const store = createWindowControlsInsetsStore({ addListener })

    store.subscribe(vi.fn())

    expect(addListener).not.toHaveBeenCalled()
    expect(store.getSnapshot()).toEqual({ left: 0, right: 0 })
  })
})
