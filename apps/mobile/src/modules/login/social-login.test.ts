import { describe, expect, it, vi } from "vitest"

import type { SocialSignInResult } from "@/src/lib/social-auth"

import { loginWithSocialProvider } from "./social-login"

const signedIn = async (): Promise<SocialSignInResult> => ({ type: "success" })

describe("loginWithSocialProvider", () => {
  it("syncs session after OAuth completes and tracks login when a user is available", async () => {
    const sequence: string[] = []
    const setPendingProviderId = vi.fn((providerId: string | null) => {
      sequence.push(`pending:${providerId ?? "none"}`)
    })
    const signInWithProvider = vi.fn(async (providerId: string) => {
      sequence.push(`sign-in:${providerId}`)
      return signedIn()
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
    expect(signInWithProvider).toHaveBeenCalledWith("google", { callbackURL: "folo://" })
    expect(trackLogin).toHaveBeenCalledTimes(1)
    expect(sequence).toEqual(["pending:google", "sign-in:google", "sync", "track", "pending:none"])
  })

  it("clears pending state and skips tracking when no session is available after OAuth", async () => {
    const setPendingProviderId = vi.fn()
    const syncSession = vi.fn(async () => false)
    const trackLogin = vi.fn()

    const result = await loginWithSocialProvider({
      providerId: "github",
      setPendingProviderId,
      signInWithProvider: vi.fn(signedIn),
      signInWithAppleIdentityToken: vi.fn(async () => {}),
      syncSession,
      trackLogin,
    })

    expect(result).toBe(false)
    expect(trackLogin).not.toHaveBeenCalled()
    expect(setPendingProviderId).toHaveBeenNthCalledWith(1, "github")
    expect(setPendingProviderId).toHaveBeenLastCalledWith(null)
  })

  it("reports a rejected OAuth callback without syncing the session", async () => {
    const setPendingProviderId = vi.fn()
    const syncSession = vi.fn(async () => true)
    const onFailure = vi.fn()

    const result = await loginWithSocialProvider({
      providerId: "google",
      setPendingProviderId,
      signInWithProvider: vi.fn(async (): Promise<SocialSignInResult> => ({
        type: "error",
        error: "state_mismatch",
      })),
      signInWithAppleIdentityToken: vi.fn(async () => {}),
      syncSession,
      trackLogin: vi.fn(),
      onFailure,
    })

    expect(result).toBe(false)
    expect(onFailure).toHaveBeenCalledWith("state_mismatch")
    expect(syncSession).not.toHaveBeenCalled()
    expect(setPendingProviderId).toHaveBeenLastCalledWith(null)
  })

  it("stays silent when the user cancels the auth session", async () => {
    const syncSession = vi.fn(async () => true)
    const onFailure = vi.fn()
    const onError = vi.fn()

    const result = await loginWithSocialProvider({
      providerId: "google",
      setPendingProviderId: vi.fn(),
      signInWithProvider: vi.fn(async (): Promise<SocialSignInResult> => ({ type: "cancel" })),
      signInWithAppleIdentityToken: vi.fn(async () => {}),
      syncSession,
      trackLogin: vi.fn(),
      onError,
      onFailure,
    })

    expect(result).toBe(false)
    expect(syncSession).not.toHaveBeenCalled()
    expect(onFailure).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })

  it("uses the Folo native app scheme as the OAuth callback URL", async () => {
    const signInWithProvider = vi.fn(signedIn)

    await loginWithSocialProvider({
      providerId: "github",
      setPendingProviderId: vi.fn(),
      signInWithProvider,
      signInWithAppleIdentityToken: vi.fn(async () => {}),
      syncSession: async () => false,
      trackLogin: vi.fn(),
    })

    expect(signInWithProvider).toHaveBeenCalledWith("github", { callbackURL: "folo://" })
  })

  it("uses the Apple token flow for Apple sign in", async () => {
    const signInWithAppleIdentityToken = vi.fn(async () => {})
    const signInWithProvider = vi.fn(signedIn)

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
