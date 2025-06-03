import type { RendererHandlers } from "@follow/electron-main"

type EventCallback<T> = (data: T) => void

export function createEventHandlers() {
  if (!window.electron) {
    // Web fallback - return empty handlers
    return {
      invalidateQuery: {
        listen: () => () => {},
      },
      updateDownloaded: {
        listen: () => () => {},
      },
      navigateEntry: {
        listen: () => () => {},
      },
    }
  }

  return {
    invalidateQuery: {
      listen: (callback: EventCallback<Parameters<RendererHandlers["invalidateQuery"]>[0]>) => {
        const channel = "renderer-event:invalidateQuery"
        const handler = (_: any, data: Parameters<RendererHandlers["invalidateQuery"]>[0]) => {
          callback(data)
        }
        window.electron!.ipcRenderer.on(channel, handler)
        return () => {
          window.electron!.ipcRenderer.removeListener(channel, handler)
        }
      },
    },
    updateDownloaded: {
      listen: (callback: EventCallback<void>) => {
        const channel = "renderer-event:updateDownloaded"
        const handler = () => {
          callback()
        }
        window.electron!.ipcRenderer.on(channel, handler)
        return () => {
          window.electron!.ipcRenderer.removeListener(channel, handler)
        }
      },
    },
    navigateEntry: {
      listen: (callback: EventCallback<Parameters<RendererHandlers["navigateEntry"]>[0]>) => {
        const channel = "renderer-event:navigateEntry"
        const handler = (_: any, data: Parameters<RendererHandlers["navigateEntry"]>[0]) => {
          callback(data)
        }
        window.electron!.ipcRenderer.on(channel, handler)
        return () => {
          window.electron!.ipcRenderer.removeListener(channel, handler)
        }
      },
    },
  }
}
