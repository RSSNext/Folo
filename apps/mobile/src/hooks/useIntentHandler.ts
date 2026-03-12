import { invalidateUserSession } from "@follow/store/user/hooks"
import * as Linking from "expo-linking"
import { useEffect } from "react"

import { useNavigation } from "../lib/navigation/hooks"
import { FollowScreen } from "../screens/(modal)/FollowScreen"

let previousIntentUrl = ""
export const resetIntentUrl = () => {
  previousIntentUrl = ""
}

type DeepLinkParams =
  | { id: string | null; type: string | null; url?: string | null; view?: string | null }
  | "refresh"
  | null

const handleIncomingUrl = (
  incomingUrl: string | null,
  navigation: ReturnType<typeof useNavigation>,
) => {
  if (!incomingUrl || incomingUrl === previousIntentUrl) {
    return
  }

  previousIntentUrl = incomingUrl

  const searchParams = extractParamsFromDeepLink(incomingUrl)
  if (!searchParams) {
    console.warn("No valid params found in deep link:", incomingUrl)
    return
  }

  if (searchParams === "refresh") {
    invalidateUserSession()
    return
  }

  navigation.presentControllerView(FollowScreen, {
    id: searchParams.id ?? undefined,
    type: (searchParams.type as "url" | "feed" | "list") ?? undefined,
    url: searchParams.url ?? undefined,
    view: searchParams.view ?? undefined,
  })
}

export function useIntentHandler() {
  const navigation = useNavigation()

  useEffect(() => {
    void Linking.getInitialURL().then((url) => {
      handleIncomingUrl(url, navigation)
    })

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
      case "add": {
        const { searchParams } = url
        if (!searchParams.has("id") && !searchParams.has("url")) return null

        return {
          id: searchParams.get("id"),
          type: searchParams.get("type"),
          url: searchParams.get("url"),
          view: searchParams.get("view"),
        }
      }
      case "list": {
        const { searchParams } = url
        if (!searchParams.has("id") && !searchParams.has("url")) return null

        return {
          id: searchParams.get("id"),
          type: "list",
          view: searchParams.get("view"),
        }
      }
      case "feed": {
        const { searchParams } = url
        if (!searchParams.has("id") && !searchParams.has("url")) return null

        return {
          id: searchParams.get("id"),
          type: "feed",
          url: searchParams.get("url"),
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
