import { invalidateUserSession } from "@follow/store/user/hooks"
import * as Linking from "expo-linking"
import { useEffect } from "react"

import { useNavigation } from "../lib/navigation/hooks"
import { FollowScreen } from "../screens/(modal)/FollowScreen"

// This needs to stay outside of react to persist between account switches
let previousIntentUrl = ""
export const resetIntentUrl = () => {
  previousIntentUrl = ""
}

export function useIntentHandler() {
  const incomingUrl = Linking.useURL()

  const navigation = useNavigation()

  useEffect(() => {
    if (incomingUrl && incomingUrl !== previousIntentUrl) {
      previousIntentUrl = incomingUrl

      const searchParams = extractParamsFromDeepLink(incomingUrl)
      if (!searchParams) {
        console.warn("No valid params found in deep link:", incomingUrl)
        return
      }

      if (searchParams === "refresh") {
        invalidateUserSession()
        return
      } else {
        navigation.presentControllerView(FollowScreen, {
          id: searchParams.id ?? undefined,
          type: (searchParams.type as "url" | "feed" | "list") ?? undefined,
          url: searchParams.url ?? undefined,
          view: searchParams.view ?? undefined,
        })
      }
    }
  }, [incomingUrl, navigation])
}

// follow://add?id=41147805276726272
// follow://add?type=list&id=60580187699502080
// follow://add?type=url&url=rsshub://rsshub/routes/en
// follow://list?id=60580187699502080
// follow://feed?id=60580187699502080&view=1
const extractParamsFromDeepLink = (
  incomingUrl: string | null,
):
  | { id: string | null; type: string | null; url?: string | null; view?: string | null }
  | "refresh"
  | null => {
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
