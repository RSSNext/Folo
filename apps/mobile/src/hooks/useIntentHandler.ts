import { invalidateUserSession } from "@follow/store/user/hooks"
import * as Linking from "expo-linking"
import { useEffect } from "react"

import { useNavigation } from "../lib/navigation/hooks"
import { FollowScreen } from "../screens/(modal)/FollowScreen"

const SUPPORTED_WEB_HOSTS = new Set([
  "app.folo.is",
  "dev.folo.is",
  "folo.is",
  "www.folo.is",
  "app.follow.is",
  "dev.follow.is",
  "follow.is",
])

type DeepLinkParams = {
  id: string | null
  type: string | null
  url?: string | null
  view?: string | null
}

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
// https://app.folo.is/share/feeds/60580187699502080
// https://app.folo.is/share/lists/60580187699502080
// https://app.folo.is/add?type=feed&id=60580187699502080
const extractParamsFromDeepLink = (
  incomingUrl: string | null,
): DeepLinkParams | "refresh" | null => {
  if (!incomingUrl) return null

  try {
    const url = new URL(incomingUrl)

    if (url.protocol === "follow:" || url.protocol === "folo:") {
      return extractParamsFromSchemeUrl(url)
    }

    if (
      (url.protocol === "https:" || url.protocol === "http:") &&
      SUPPORTED_WEB_HOSTS.has(url.hostname)
    ) {
      return extractParamsFromWebUrl(url)
    }

    return null
  } catch {
    return null
  }
}

const extractParamsFromSchemeUrl = (url: URL): DeepLinkParams | "refresh" | null => {
  switch (url.hostname) {
    case "add": {
      return extractParamsFromAddSearchParams(url.searchParams)
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
}

const extractParamsFromWebUrl = (url: URL): DeepLinkParams | "refresh" | null => {
  const pathname = normalizePathname(url.pathname)

  if (pathname === "/refresh") {
    return "refresh"
  }

  if (pathname === "/add") {
    return extractParamsFromAddSearchParams(url.searchParams)
  }

  const feedMatch = pathname.match(/^\/(?:share\/feeds|feed)\/([^/]+)$/)
  if (feedMatch) {
    const feedId = feedMatch[1]
    if (!feedId) return null

    return {
      id: decodeURIComponent(feedId),
      type: "feed",
      view: url.searchParams.get("view"),
    }
  }

  const listMatch = pathname.match(/^\/(?:share\/lists|list)\/([^/]+)$/)
  if (listMatch) {
    const listId = listMatch[1]
    if (!listId) return null

    return {
      id: decodeURIComponent(listId),
      type: "list",
      view: url.searchParams.get("view"),
    }
  }

  return null
}

const extractParamsFromAddSearchParams = (searchParams: URLSearchParams): DeepLinkParams | null => {
  if (!searchParams.has("id") && !searchParams.has("url")) return null

  return {
    id: searchParams.get("id"),
    type: searchParams.get("type"),
    url: searchParams.get("url"),
    view: searchParams.get("view"),
  }
}

const normalizePathname = (pathname: string) => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }
  return pathname
}
