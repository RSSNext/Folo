import { env } from "@env"
import { getUser } from "@renderer/atoms/user"

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    posthog?: typeof import("posthog-js").default
  }
}
export const initPostHog = async () => {
  if (import.meta.env.DEV) return
  const { default: posthog } = await import("posthog-js")

  if (env.VITE_POSTHOG_KEY === undefined) return
  posthog.init(env.VITE_POSTHOG_KEY, {
    person_profiles: "identified_only",
  })

  window.posthog = posthog

  const user = getUser()
  if (user) {
    posthog.identify(user.id, { name: user.name, handle: user.handle })
  }
}
