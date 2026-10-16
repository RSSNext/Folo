import { APP_PROTOCOL, LEGACY_APP_PROTOCOL } from "@follow/shared/constants"

// Deep links can reach the main process before the renderer can take them: at a cold start, as
// a launch argument on Windows and Linux or an `open-url` event on macOS, and while the main
// window is created or reloaded. The renderer drops calls it has no handler for yet, so links
// wait here until it reports that it is ready.

let isRendererReady = false
let pendingUrls: string[] = []
let handleUrl: ((url: string) => void) | null = null

const deepLinkPrefixes = [APP_PROTOCOL, LEGACY_APP_PROTOCOL].map((protocol) => `${protocol}://`)

export const isDeepLink = (value: string) =>
  deepLinkPrefixes.some((prefix) => value.toLowerCase().startsWith(prefix))

const flush = () => {
  if (!isRendererReady || !handleUrl) return
  const urls = pendingUrls
  pendingUrls = []
  for (const url of urls) handleUrl(url)
}

export const setDeepLinkHandler = (handler: (url: string) => void) => {
  handleUrl = handler
  flush()
}

export const openDeepLink = (url: string) => {
  pendingUrls.push(url)
  flush()
}

export const setRendererReady = (ready: boolean) => {
  isRendererReady = ready
  flush()
}
