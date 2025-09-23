import { cn } from "@follow/utils"
import { memo, useRef } from "react"

import { MarkdownAnimateText } from "./animated/AnimatedMarkdown"
import { parseIncompleteMarkdown } from "./parse-incomplete-markdown"

export const AIMarkdownStreamingMessage = memo(
  ({
    text,
    className: classNameProp,
    isStreaming,
  }: {
    text: string
    className?: string
    isStreaming?: boolean
  }) => {
    const className = tw`prose max-w-full dark:prose-invert prose-sm
  prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-2 prose-h3:text-lg prose-h4:text-base prose-h5:text-base prose-h6:text-sm
  prose-li:list-disc prose-li:marker:text-accent prose-hr:border-border prose-hr:mx-8
  w-[calc(var(--ai-chat-layout-width,65ch))]
  prose-pre:text-base
  `

    const stableStreamingState = useRef(isStreaming)
    return (
      <div className={cn(className, classNameProp)}>
        <MarkdownAnimateText
          content={parseIncompleteMarkdown(text)}
          isStreaming={stableStreamingState.current}
        />
      </div>
    )
  },
)
