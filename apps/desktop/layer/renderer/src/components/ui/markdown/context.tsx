import { createContext as reactCreateContext } from "react"
import { createContext } from "use-context-selector"

import type { MarkdownImage, MarkdownRenderActions } from "./types"

export const MarkdownRenderContainerRefContext = reactCreateContext<HTMLElement | null>(null)

export const MarkdownImageRecordContext = createContext<Record<string, MarkdownImage>>({})

export const MarkdownRenderActionContext = reactCreateContext<MarkdownRenderActions>({
  transformUrl: (url) => url ?? "",
  isAudio: () => false,
  ensureAndRenderTimeStamp: () => false,
})
