/**
 * @see https://github.com/Ephibbs/flowtoken/blob/main/src/components/AnimatedMarkdown.tsx
 */
import "./styles.css"

import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { isBizId } from "@follow/utils"
import * as React from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

import { MemoizedShikiCode } from "~/components/ui/code-highlighter"
import { MarkdownLink } from "~/components/ui/markdown/renderers"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { usePeekModal } from "~/hooks/biz/usePeekModal"

import { ANIMATION_STYLE as ANIMATION_STYLE_DEFAULT, DEFAULT_ANIMATION } from "./constants"
import { TokenizedText } from "./TokenizedText"

interface MarkdownAnimateTextProps {
  content: string
  isStreaming?: boolean
}

const emptyObject = {}

export const MarkdownAnimateText: React.FC<MarkdownAnimateTextProps> = ({
  content,
  isStreaming,
}) => {
  const ANIMATION_STYLE = isStreaming ? ANIMATION_STYLE_DEFAULT : emptyObject

  const animateText: (text: string | Array<any>) => React.ReactNode = React.useCallback(
    (text: string | Array<any>) => {
      if (!isStreaming) return text
      text = Array.isArray(text) ? text : [text]
      let keyCounter = 0
      const processText: (input: any, keyPrefix?: string) => React.ReactNode = (
        input: any,
        keyPrefix = "item",
      ) => {
        if (Array.isArray(input)) {
          // Process each element in the array
          return input.map((element, index) => (
            <React.Fragment key={`${keyPrefix}-${index}`}>
              {processText(element, `${keyPrefix}-${index}`)}
            </React.Fragment>
          ))
        } else if (typeof input === "string") {
          return <TokenizedText key={`pcc-${keyCounter++}`} input={input} />
        } else {
          // Return non-string, non-element inputs unchanged (null, undefined, etc.)
          return (
            <span
              key={`pcc-${keyCounter++}`}
              style={{
                animation: DEFAULT_ANIMATION,
                whiteSpace: "pre-wrap",
                display: "inline-block",
              }}
            >
              {input}
            </span>
          )
        }
      }

      return processText(text)
    },
    [isStreaming],
  )

  // Memoize components object to avoid redefining components unnecessarily
  const components: Components = React.useMemo(
    () => ({
      pre: ({ children }) => {
        const props = React.isValidElement(children) && "props" in children && children.props

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
        return React.createElement(RelatedEntryLink, { ...props } as any)
      },
      "folo-entry": ({ node, children, ...props }: any) => (
        <InlineFoloReference type="entry" style={ANIMATION_STYLE} {...props}>
          {children}
        </InlineFoloReference>
      ),
      "folo-feed": ({ node, children, ...props }: any) => (
        <InlineFoloReference type="feed" style={ANIMATION_STYLE} {...props}>
          {children}
        </InlineFoloReference>
      ),

      text: ({ node, ...props }: any) => <span {...props}>{animateText(props.children)}</span>,
      h1: ({ node, ...props }: any) => <h1 {...props}>{animateText(props.children)}</h1>,
      h2: ({ node, ...props }: any) => <h2 {...props}>{animateText(props.children)}</h2>,
      h3: ({ node, ...props }: any) => <h3 {...props}>{animateText(props.children)}</h3>,
      h4: ({ node, ...props }: any) => <h4 {...props}>{animateText(props.children)}</h4>,
      h5: ({ node, ...props }: any) => <h5 {...props}>{animateText(props.children)}</h5>,
      h6: ({ node, ...props }: any) => <h6 {...props}>{animateText(props.children)}</h6>,
      p: ({ node, ...props }: any) => <p {...props}>{animateText(props.children)}</p>,
      li: ({ node, ...props }: any) => (
        <li {...props} style={ANIMATION_STYLE}>
          {animateText(props.children)}
        </li>
      ),

      strong: ({ node, ...props }: any) => (
        <strong {...props}>{animateText(props.children)}</strong>
      ),
      em: ({ node, ...props }: any) => <em {...props}>{animateText(props.children)}</em>,

      hr: ({ node, ...props }: any) => (
        <hr {...props} className="whitespace-pre-wrap" style={ANIMATION_STYLE} />
      ),

      table: ({ children, ref, node, ...props }) => {
        return (
          <div className="border-border bg-material-thin overflow-x-auto rounded-lg border">
            <table
              {...props}
              style={ANIMATION_STYLE}
              className="divide-border my-0 min-w-full divide-y text-sm"
            >
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
            {animateText(children as any)}
          </tr>
        )
      },
      td: ({ children, ref, node, ...props }) => {
        return (
          <td {...props} className="text-text whitespace-nowrap px-4 py-3 text-sm">
            {animateText(children as any)}
          </td>
        )
      },
    }),
    [ANIMATION_STYLE, animateText],
  )

  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
      {content}
    </ReactMarkdown>
  )
}

const InlineFoloReference: React.FC<{
  type: "entry" | "feed"
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}> = ({ type, children, className, style }) => {
  const peekModal = usePeekModal()
  const navigateEntry = useNavigateEntry()

  const targetId = React.useMemo(() => {
    return React.Children.toArray(children)
      .map((child) => {
        if (typeof child === "string" || typeof child === "number") {
          return String(child)
        }
        return ""
      })
      .join("")
      .trim()
  }, [children])

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (!targetId) return

      if (type === "entry") {
        peekModal(targetId, "modal")
      } else {
        navigateEntry({ feedId: targetId, entryId: null })
      }
    },
    [navigateEntry, peekModal, targetId, type],
  )

  if (!targetId) return null

  const baseClassName =
    "inline-flex items-center align-middle cursor-pointer text-text-secondary mx-[0.15em] opacity-80 transition-opacity hover:opacity-100 hover:text-text"

  return (
    <button
      type="button"
      aria-label={type === "entry" ? `Open entry ${targetId}` : `Open feed ${targetId}`}
      title={type === "entry" ? `Open entry ${targetId}` : `Open feed ${targetId}`}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={style}
      onClick={handleClick}
    >
      <i className="i-mgc-docment-cute-re size-[1em]" />
    </button>
  )
}

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
