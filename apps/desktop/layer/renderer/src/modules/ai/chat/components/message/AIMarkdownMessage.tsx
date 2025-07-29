import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { cn, isBizId } from "@follow/utils"
import { createElement, isValidElement, memo, useMemo } from "react"

import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { MermaidDiagram } from "~/components/ui/diagrams"
import { MarkdownLink } from "~/components/ui/markdown/renderers/MarkdownLink"
import { usePeekModal } from "~/hooks/biz/usePeekModal"

export const AIMarkdownMessage = memo(
  ({
    text,
    className: classNameProp,
    isProcessing,
  }: {
    text: string
    className?: string
    isProcessing?: boolean
  }) => {
    const className = tw`prose dark:prose-invert text-sm
  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-base prose-h6:text-sm
  prose-li:list-disc prose-li:marker:text-accent prose-hr:border-border prose-hr:mx-8
`

    return (
      <div className={cn(className, classNameProp)}>
        {useMemo(
          () =>
            parseMarkdown(text, {
              components: {
                pre: ({ children }) => {
                  // props
                  const props = isValidElement(children) && "props" in children && children.props

                  if (props) {
                    const { className, children } = props as any

                    if (
                      className &&
                      className.includes("language-") &&
                      typeof children === "string"
                    ) {
                      const language = className.replace("language-", "")
                      const code = children

                      // Render Mermaid diagrams
                      if (language === "mermaid") {
                        return <MermaidDiagram code={code} shouldRender={!isProcessing} />
                      }

                      return <ShikiHighLighter code={code} language={language} showCopy />
                    }
                  }

                  return <pre className="text-text-secondary">{children}</pre>
                },
                a: ({ node, ...props }) => {
                  return createElement(RelatedEntryLink, { ...props } as any)
                },
              },
            }).content,
          [isProcessing, text],
        )}
      </div>
    )
  },
)

const RelatedEntryLink = (props: LinkProps) => {
  const { href, children } = props
  const entryId = isBizId(href) ? href : null

  const peekModal = usePeekModal()
  if (!entryId) {
    return <MarkdownLink {...props} />
  }
  return (
    <button
      type="button"
      className="follow-link--underline text-text cursor-pointer font-semibold no-underline"
      onClick={() => {
        peekModal(entryId, "modal")
      }}
    >
      {children}
      <i className="i-mgc-arrow-right-up-cute-re size-[0.9em] translate-y-[2px] opacity-70" />
    </button>
  )
}
