import { invalidateUserSession } from "@follow/store/user/hooks"
import { jotaiStore } from "@follow/utils"
import * as Linking from "expo-linking"
import { useEffect } from "react"

import { getUnhandledLaunchLink } from "../lib/launch-link"
import { dismissInAppBrowser } from "../lib/native"
import { useNavigation } from "../lib/navigation/hooks"
import type { Navigation } from "../lib/navigation/Navigation"
import { FollowScreen } from "../screens/(modal)/FollowScreen"
import { LoginScreen } from "../screens/(modal)/LoginScreen"

// The launch link can be reported both by getInitialURL and as a url event. Only that echo is
// skipped: opening the same link again later, like a second "Add to Folo" tap, must work.
const DUPLICATE_LINK_WINDOW_MS = 2000
let lastHandledLink: { url: string; at: number } | null = null
let initialUrlChecked = false

type DeepLinkParams =
  | { id: string | null; type: "url" | "feed" | "list"; url?: string | null; view?: string | null }
  | "refresh"
  | null

type FollowScreenProps = {
  id?: string
  type: "feed" | "list" | "url"
  url?: string
  view?: string
}

// The follow form of a link that came in while the sign-in screen was up
let pendingFollowScreen: FollowScreenProps | null = null

const presentFollowScreen = async (navigation: Navigation, props: FollowScreenProps) => {
  // A link opened from a page in the in-app browser, such as "Open in Folo", would open its form
  // under the browser
  await dismissInAppBrowser()

  // Over the sign-in screen, the form would hide it, and Follow could not bring it back. Signing in
  // also closes what is over that screen, so the form waits for it to close either way. Checked
  // only now, as the sign-in screen of a launch without a session can open while the browser closes.
  if (navigation.hasControllerView(LoginScreen)) {
    pendingFollowScreen = props
    return
  }

  // The navigation keeps a screen that is on top already, so the open form would stay, showing
  // and following the feed of the link before. The new link takes its place.
  const topRoute = jotaiStore.get(navigation.__dangerous_getCtxValue().routesAtom).at(-1)
  if (topRoute?.Component === FollowScreen) {
    navigation.__internal_dismiss(topRoute.id)
  }

  navigation.presentControllerView(FollowScreen, props)
}

const presentPendingFollowScreen = (navigation: Navigation) => {
  if (!pendingFollowScreen || navigation.hasControllerView(LoginScreen)) return
  const props = pendingFollowScreen
  pendingFollowScreen = null
  void presentFollowScreen(navigation, props)
}

/**
 * Opens the follow form of a link that waited for the sign-in screen, once that screen closed,
 * whether the user signed in or not. Returns the function that stops watching.
 */
export const watchPendingFollowScreen = (navigation: Navigation) =>
  jotaiStore.sub(navigation.__dangerous_getCtxValue().routesAtom, () => {
    // Not from within the change of the screens
    setTimeout(() => presentPendingFollowScreen(navigation), 0)
  })

export const handleIncomingUrl = (incomingUrl: string | null, navigation: Navigation) => {
  if (!incomingUrl) return
  const now = Date.now()
  if (lastHandledLink?.url === incomingUrl && now - lastHandledLink.at < DUPLICATE_LINK_WINDOW_MS) {
    return
  }
  lastHandledLink = { url: incomingUrl, at: now }

  const searchParams = extractParamsFromDeepLink(incomingUrl)
  if (!searchParams) {
    console.warn("No valid params found in deep link:", incomingUrl)
    return
  }

  if (searchParams === "refresh") {
    invalidateUserSession()
    return
  }

  void presentFollowScreen(navigation, {
    id: searchParams.id ?? undefined,
    type: searchParams.type,
    url: searchParams.url ?? undefined,
    view: searchParams.view ?? undefined,
  })
}

export function useIntentHandler() {
  const navigation = useNavigation()

  useEffect(() => watchPendingFollowScreen(navigation), [navigation])

  useEffect(() => {
    // The launch link stays the initial URL for the whole process, reloads in place included
    if (!initialUrlChecked) {
      initialUrlChecked = true
      void getUnhandledLaunchLink().then((url) => {
        handleIncomingUrl(url, navigation)
      })
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleIncomingUrl(url, navigation)
    })

    return () => {
      subscription.remove()
    }
  }, [navigation])
}

const extractParamsFromDeepLink = (incomingUrl: string | null): DeepLinkParams => {
  if (!incomingUrl) return null

  try {
    const url = new URL(incomingUrl)
    if (url.protocol !== "follow:" && url.protocol !== "folo:") return null

    switch (url.hostname) {
      case "add":
      case "feed": {
        const { searchParams } = url
        const id = searchParams.get("id")
        const feedUrl = searchParams.get("url")
        const view = searchParams.get("view")
        // Without an id the feed is looked up by its URL
        if (!id) return feedUrl ? { id: null, type: "url", url: feedUrl, view } : null

        const isList = url.hostname === "add" && searchParams.get("type") === "list"
        return { id, type: isList ? "list" : "feed", view }
      }
      case "list": {
        const { searchParams } = url
        const id = searchParams.get("id")
        if (!id) return null

        return {
          id,
          type: "list",
          view: searchParams.get("view"),
        }
      }
      case "refresh": {
        return "refresh"
      }
      default: {
        return null
      }
    }
  } catch {
    return null
  }
}
