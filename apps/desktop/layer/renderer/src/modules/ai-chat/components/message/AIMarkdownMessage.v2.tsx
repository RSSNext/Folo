import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { cn, isBizId } from "@follow/utils"
import { createElement, isValidElement, memo, useMemo } from "react"

import { MemoizedShikiCode } from "~/components/ui/code-highlighter"
import { MarkdownLink } from "~/components/ui/markdown/renderers/MarkdownLink"
import { usePeekModal } from "~/hooks/biz/usePeekModal"

export const AIMarkdownStreamingMessage = memo(
  ({ text, className: classNameProp }: { text: string; className?: string }) => {
    const className = `prose max-w-full dark:prose-invert text-sm
  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-base prose-h6:text-sm
  prose-li:list-disc prose-li:marker:text-accent prose-hr:border-border prose-hr:mx-8`

    const parsedContent = useMemo(() => baseAIMarkdownParser(text), [text])

    return <div className={cn(className, classNameProp)}>{parsedContent}</div>
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

function baseAIMarkdownParser(content: string) {
  return parseMarkdown(content, {
    components: {
      pre: ({ children }) => {
        const props = isValidElement(children) && "props" in children && children.props

        if (props) {
          const { className, children } = props as any

          if (className && className.includes("language-") && typeof children === "string") {
            const language = className.replace("language-", "")
            const code = children

            return <MemoizedShikiCode code={code} language={language} showCopy />
          }
        }

        return <pre className="text-text-secondary">{children}</pre>
      },
      a: ({ node, ...props }) => {
        return createElement(RelatedEntryLink, { ...props } as any)
      },
      table: ({ children, ref, node, ...props }) => {
        return (
          <div className="border-border bg-material-thin overflow-x-auto rounded-lg border">
            <table {...props} className="divide-border my-0 min-w-full divide-y text-sm">
              {children}
            </table>
          </div>
        )
      },
      thead: ({ children, ref, node, ...props }) => {
        return (
          <thead {...props} className="bg-fill-tertiary">
            {children}
          </thead>
        )
      },
      th: ({ children, ref, node, ...props }) => {
        return (
          <th
            {...props}
            className="text-text-secondary whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
          >
            {children}
          </th>
        )
      },
      tbody: ({ children, ref, node, ...props }) => {
        return (
          <tbody {...props} className="bg-material-ultra-thin divide-border divide-y">
            {children}
          </tbody>
        )
      },
      tr: ({ children, ref, node, ...props }) => {
        return (
          <tr {...props} className="hover:bg-material-thin transition-colors duration-150">
            {children}
          </tr>
        )
      },
      td: ({ children, ref, node, ...props }) => {
        return (
          <td {...props} className="text-text whitespace-nowrap px-4 py-3 text-sm">
            {children}
          </td>
        )
      },
    },
  }).content
}
