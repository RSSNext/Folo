const parseUrl = (value: string) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Whether an RSSHub instance can be registered at a URL, as the server checks it: http(s),
 * without credentials, a query or a fragment. Routes are fetched by absolute path, which drops
 * a query and a fragment, and fetch refuses a URL with credentials.
 */
export const isRSSHubInstanceBaseUrl = (value: string) => {
  const url = parseUrl(value)
  return (
    !!url &&
    (url.protocol === "http:" || url.protocol === "https:") &&
    !url.username &&
    !url.password &&
    // An empty query or fragment still leaves its "?" or "#" in the URL
    !url.href.includes("?") &&
    !url.href.includes("#")
  )
}

/**
 * Whether the server saves an instance at `value`. An edit that sends back the URL an instance
 * was stored with keeps saving, even one stored before URLs were checked.
 */
export const canSaveRSSHubInstanceBaseUrl = (value: string, storedBaseUrl?: string | null) => {
  if (isRSSHubInstanceBaseUrl(value)) return true
  if (!storedBaseUrl) return false
  return parseUrl(value)?.toString() === parseUrl(storedBaseUrl)?.toString()
}
