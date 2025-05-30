import { createContext } from "react"

export const IsInParagraphContext = createContext(false)

export const MarkdownRenderContainerRefContext = createContext<HTMLDivElement | null>(null)
