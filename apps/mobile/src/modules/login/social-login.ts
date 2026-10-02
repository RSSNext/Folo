import type { SocialSignInResult } from "@/src/lib/social-auth"

export const nativeOAuthCallbackURL = "folo://"

type LoginWithSocialProviderOptions = {
  providerId: string
  setPendingProviderId: (providerId: string | null) => void
  signInWithProvider: (
    providerId: string,
    options: { callbackURL: typeof nativeOAuthCallbackURL },
  ) => Promise<SocialSignInResult>
  signInWithAppleIdentityToken: () => Promise<void>
  syncSession: () => Promise<boolean>
  trackLogin: () => void
  onError?: (error: unknown) => void
  // The provider flow finished without a session, e.g. the OAuth callback was rejected.
  onFailure?: (error: string) => void
}

export async function loginWithSocialProvider({
  providerId,
  setPendingProviderId,
  signInWithProvider,
  signInWithAppleIdentityToken,
  syncSession,
  trackLogin,
  onError,
  onFailure,
}: LoginWithSocialProviderOptions) {
  setPendingProviderId(providerId)

  try {
    if (providerId === "apple") {
      await signInWithAppleIdentityToken()
    } else {
      const result = await signInWithProvider(providerId, { callbackURL: nativeOAuthCallbackURL })
      if (result.type === "error") {
        onFailure?.(result.error)
        return false
      }
      if (result.type === "cancel") {
        return false
      }
    }

    const hasSession = await syncSession()
    if (hasSession) {
      trackLogin()
    }
    return hasSession
  } catch (error) {
    onError?.(error)
    return false
  } finally {
    setPendingProviderId(null)
  }
}
