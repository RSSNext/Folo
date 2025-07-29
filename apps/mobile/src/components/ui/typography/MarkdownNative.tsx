import { useMemo } from "react"

import { renderMarkdown } from "@/src/lib/markdown"

export const MarkdownNative: WebComponent<{
  value: string
}> = ({ value }) => {
  return useMemo(() => {
    return renderMarkdown(value)
  }, [value])
}
