import { describe, expect, it, vi } from "vitest"

import { createSharedAnimation } from "./shared-animation"

const setup = () => {
  const start = vi.fn()
  const stop = vi.fn()
  return { hold: createSharedAnimation({ start, stop }), start, stop }
}

describe("createSharedAnimation", () => {
  it("starts once for every holder and stops when the last one lets go", () => {
    const { hold, start, stop } = setup()

    const releaseFirst = hold()
    const releaseSecond = hold()
    expect(start).toHaveBeenCalledTimes(1)

    releaseFirst()
    expect(stop).not.toHaveBeenCalled()

    releaseSecond()
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it("does not count a holder that lets go twice", () => {
    const { hold, stop } = setup()

    const releaseFirst = hold()
    const releaseSecond = hold()
    releaseFirst()
    releaseFirst()
    expect(stop).not.toHaveBeenCalled()

    releaseSecond()
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it("starts again for a holder that comes after it stopped", () => {
    const { hold, start, stop } = setup()

    hold()()
    hold()
    expect(start).toHaveBeenCalledTimes(2)
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it("follows a mount, unmount and mount again of the same view", () => {
    const { hold, start, stop } = setup()

    // React's strict mode runs an effect, its cleanup and the effect again
    const releaseStrictModeRun = hold()
    releaseStrictModeRun()
    const release = hold()
    expect(start).toHaveBeenCalledTimes(2)
    expect(stop).toHaveBeenCalledTimes(1)

    release()
    expect(stop).toHaveBeenCalledTimes(2)
  })
})
