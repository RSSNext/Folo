"use dom"
import "@/src/global.css"

import { parseMarkdown } from "@follow/components/src/utils/parse-markdown"
import { cn } from "@follow/utils"
import { useMemo } from "react"
import { useDarkMode } from "usehooks-ts"

import { useCSSInjection } from "@/src/theme/web"

declare const window: {
  openLinkInModal: (url: string) => void
}
/**
 * @internal
 */
const MarkdownWeb: WebComponent<{
  value: string
  style?: React.CSSProperties
  className?: string
}> = ({ value, style, className }) => {
  useCSSInjection()

  const { isDarkMode } = useDarkMode()
  return (
    <div
      className={cn("text-text prose min-w-0", isDarkMode ? "prose-invert" : "prose", className)}
      style={style}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
:root {
  overscroll-behavior: none;
}
body, html {
  overflow-y: hidden;
}
        `,
        }}
      />
      {useMemo(
        () =>
          parseMarkdown(value, {
            components: {
              a: ({ children, ...props }) => (
                <a
                  onClick={(e) => {
                    if (!props.href) return

                    e.preventDefault()
                    window.openLinkInModal(props.href)
                  }}
                  {...props}
                >
                  {children}
                </a>
              ),
            },
          }).content,
        [value],
      )}
    </div>
  )
}

export default MarkdownWeb
