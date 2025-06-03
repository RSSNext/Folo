import type { WebContents } from "electron"

import type { RendererHandlers } from "../renderer-handlers"

// Send events to renderer
export function sendToRenderer<K extends keyof RendererHandlers>(
  webContents: WebContents,
  event: K,
  data: Parameters<RendererHandlers[K]>[0],
) {
  webContents.send(`renderer-event:${event}`, data)
}

// Create handlers object for convenient access
export function getRendererHandlers(webContents: WebContents) {
  return {
    invalidateQuery: {
      send: (data: Parameters<RendererHandlers["invalidateQuery"]>[0]) =>
        sendToRenderer(webContents, "invalidateQuery", data),
    },
    updateDownloaded: {
      send: () => webContents.send("renderer-event:updateDownloaded"),
    },
    navigateEntry: {
      send: (data: Parameters<RendererHandlers["navigateEntry"]>[0]) =>
        sendToRenderer(webContents, "navigateEntry", data),
    },
  }
}
