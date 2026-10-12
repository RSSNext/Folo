import { isTwitterUrl, isXUrl } from "@follow/utils/link-parser"

// First path segments of x.com that are app routes, not user handles
const X_RESERVED_PATHS = new Set([
  "explore",
  "hashtag",
  "home",
  "i",
  "intent",
  "messages",
  "notifications",
  "search",
  "settings",
  "share",
])
const X_HANDLE_REGEX = /^\w{1,15}$/

export const parseSocialMedia = (parsedUrl?: string | null) => {
  if (!parsedUrl) return

  const isX = isXUrl(parsedUrl).validate || isTwitterUrl(parsedUrl).validate
  if (!isX) return

  // Both x.com/<handle> and x.com/<handle>/status/<id> start with the handle
  const handle = new URL(parsedUrl).pathname.split("/").find(Boolean)
  if (!handle || X_RESERVED_PATHS.has(handle.toLowerCase()) || !X_HANDLE_REGEX.test(handle)) {
    return
  }

  return {
    type: "x",
    meta: {
      handle,
    },
  }
}
