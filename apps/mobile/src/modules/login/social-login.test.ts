import { describe, expect, it, vi } from "vitest"

import { loginWithSocialProvider } from "./social-login"

describe("loginWithSocialProvider", () => {
  it("syncs session after OAuth completes and tracks login when a user is available", async () => {
    const sequence: string[] = []
    const setPendingProviderId = vi.fn((providerId: string | null) => {
      sequence.push(`pending:${providerId ?? "none"}`)
    })
    const signInWithProvider = vi.fn(async (providerId: string) => {
      sequence.push(`sign-in:${providerId}`)
    })
    const signInWithAppleIdentityToken = vi.fn(async () => {
      sequence.push("apple")
    })
    const syncSession = vi.fn(async () => {
      sequence.push("sync")
      return true
    })
    const trackLogin = vi.fn(() => {
      sequence.push("track")
    })

    const result = await loginWithSocialProvider({
      providerId: "google",
      setPendingProviderId,
      signInWithProvider,
      signInWithAppleIdentityToken,
      syncSession,
      trackLogin,
    })

    expect(result).toBe(true)
    expect(signInWithProvider).toHaveBeenCalledWith("google")
    expect(trackLogin).toHaveBeenCalledTimes(1)
    expect(sequence).toEqual(["pending:google", "sign-in:google", "sync", "track", "pending:none"])
  })

  it("clears pending state and skips tracking when no session is available after OAuth", async () => {
    const setPendingProviderId = vi.fn()
    const signInWithProvider = vi.fn(async () => {})
    const syncSession = vi.fn(async () => false)
    const trackLogin = vi.fn()

    const result = await loginWithSocialProvider({
      providerId: "github",
      setPendingProviderId,
      signInWithProvider,
      signInWithAppleIdentityToken: vi.fn(async () => {}),
      syncSession,
      trackLogin,
    })

    expect(result).toBe(false)
    expect(trackLogin).not.toHaveBeenCalled()
    expect(setPendingProviderId).toHaveBeenNthCalledWith(1, "github")
    expect(setPendingProviderId).toHaveBeenLastCalledWith(null)
  })

  it("uses the Apple token flow for Apple sign in", async () => {
    const signInWithAppleIdentityToken = vi.fn(async () => {})
    const signInWithProvider = vi.fn(async () => {})

    await loginWithSocialProvider({
      providerId: "apple",
      setPendingProviderId: vi.fn(),
      signInWithProvider,
      signInWithAppleIdentityToken,
      syncSession: async () => true,
      trackLogin: vi.fn(),
    })

    expect(signInWithAppleIdentityToken).toHaveBeenCalledTimes(1)
    expect(signInWithProvider).not.toHaveBeenCalled()
  })
})
