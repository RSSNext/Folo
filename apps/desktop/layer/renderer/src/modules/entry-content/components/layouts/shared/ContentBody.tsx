import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"

import { HTML } from "~/components/ui/markdown/HTML"
import { readableContentMaxWidthClassName } from "~/constants/ui"
import { useRenderStyle } from "~/hooks/biz/useRenderStyle"

interface ContentBodyProps {
  entryId: string
  className?: string
  compact?: boolean
  noMedia?: boolean
  translation?: {
    content?: string
    title?: string
  }
}

export const ContentBody: React.FC<ContentBodyProps> = ({
  entryId,
  className,
  compact = false,
  noMedia = false,
  translation,
}) => {
  const entry = useEntry(entryId, (state) => ({
    content: state.content,
    description: state.description,
  }))

  const renderStyle = useRenderStyle({
    baseFontSize: compact ? 14 : 16,
    baseLineHeight: compact ? 1.625 : 1.7,
  })

  if (!entry) return null

  const content = translation?.content || entry.content || entry.description

  if (!content) return null

  return (
    <HTML
      as="div"
      className={cn(
        "prose dark:prose-invert",
        "prose-blockquote:mt-0",
        "cursor-auto select-text",
        readableContentMaxWidthClassName,
        compact ? "text-sm leading-relaxed" : "text-base leading-relaxed",
        className,
      )}
      noMedia={noMedia}
      style={renderStyle}
    >
      {content}
    </HTML>
  )
}
