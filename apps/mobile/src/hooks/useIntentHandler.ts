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

      navigation.presentControllerView(FollowScreen, {
        id: searchParams.get("id") ?? undefined,
        type: (searchParams.get("type") as "url" | "feed" | "list") ?? undefined,
        url: searchParams.get("url") ?? undefined,
      })
    }
  }, [incomingUrl, navigation])
}

// follow://add?id=41147805276726272
// follow://add?type=list&id=60580187699502080
// follow://add?type=url&url=rsshub://rsshub/routes/en
const extractParamsFromDeepLink = (incomingUrl: string | null): URLSearchParams | null => {
  if (!incomingUrl) return null

  try {
    const url = new URL(incomingUrl)
    if (url.protocol !== "follow:" || url.hostname !== "add") return null

    const { searchParams } = url

    // If no valid parameters were found (neither id nor url)
    if (!searchParams.has("id") && !searchParams.has("url")) return null

    return searchParams
  } catch {
    return null
  }
}
