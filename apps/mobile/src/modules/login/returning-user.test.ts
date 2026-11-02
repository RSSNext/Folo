import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ kv: new Map<string, string>() }))

vi.mock("@/src/lib/kv", () => ({
  kv: {
    getSync: (key: string) => mocks.kv.get(key) ?? null,
    setSync: (key: string, value: string) => void mocks.kv.set(key, value),
  },
}))

const { hasSignedInBefore, rememberSignedIn } = await import("./returning-user")

describe("returning user", () => {
  beforeEach(() => {
    mocks.kv.clear()
  })

  it("starts a device nobody signed in on with signing up", () => {
    expect(hasSignedInBefore()).toBe(false)
  })

  it("starts with signing in once someone signed in, after sign-out or expiry too", () => {
    rememberSignedIn()

    expect(hasSignedInBefore()).toBe(true)
  })
})
