/**
 * @see https://github.com/Ephibbs/flowtoken/blob/main/src/components/AnimatedMarkdown.tsx
 */

import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { cn, isBizId } from "@follow/utils"
import * as React from "react"
import type { Components } from "react-markdown"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

import { MemoizedShikiCode } from "~/components/ui/code-highlighter"
import { EntryPreviewCard, FeedPreviewCard } from "~/components/ui/hover-preview"
import { MarkdownLink } from "~/components/ui/markdown/renderers"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { usePeekModal } from "~/hooks/biz/usePeekModal"

import { ANIMATION_STYLE as ANIMATION_STYLE_DEFAULT } from "./constants"
import { TokenizedText } from "./TokenizedText"

interface MarkdownAnimateTextProps {
  content: string
  isStreaming?: boolean
}

const emptyObject = {}
const animateText: (text: string | Array<any>) => React.ReactNode = (text: string | Array<any>) => {
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
    } else if (typeof input === "number") {
      return <TokenizedText key={`pcc-${keyCounter++}`} input={String(input)} />
    } else if (React.isValidElement(input)) {
      // Preserve element structure and do not wrap block elements (avoid <span><ul>...)
      return React.cloneElement(input as React.ReactElement, { key: `pcc-${keyCounter++}` })
    } else {
      // Return other inputs unchanged (null, undefined, booleans, etc.)
      return input
    }
  }

  return processText(text)
}

const createAiMessageMarkdownElementsRender = (canAnimate: boolean) => {
  const ANIMATION_STYLE = canAnimate ? ANIMATION_STYLE_DEFAULT : emptyObject

  const textAnimator = canAnimate ? animateText : (text: string | Array<any>) => text

  return {
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

      return <pre className="bg-material-medium text-text-secondary">{children}</pre>
    },
    a: ({ node, ...props }) => {
      return React.createElement(RelatedEntryLink, { ...props } as any)
    },
    "mention-entry": ({ node, children, ...props }: any) => (
      <InlineFoloReference type="entry" style={ANIMATION_STYLE} {...props}>
        {children}
      </InlineFoloReference>
    ),
    "mention-feed": ({ node, children, ...props }: any) => (
      <InlineFoloReference type="feed" style={ANIMATION_STYLE} {...props}>
        {children}
      </InlineFoloReference>
    ),

    text: ({ node, ...props }: any) => <span {...props}>{textAnimator(props.children)}</span>,
    h1: ({ node, ...props }: any) => <h1 {...props}>{textAnimator(props.children)}</h1>,
    h2: ({ node, ...props }: any) => <h2 {...props}>{textAnimator(props.children)}</h2>,
    h3: ({ node, ...props }: any) => <h3 {...props}>{textAnimator(props.children)}</h3>,
    h4: ({ node, ...props }: any) => <h4 {...props}>{textAnimator(props.children)}</h4>,
    h5: ({ node, ...props }: any) => <h5 {...props}>{textAnimator(props.children)}</h5>,
    h6: ({ node, ...props }: any) => <h6 {...props}>{textAnimator(props.children)}</h6>,
    p: ({ node, ...props }: any) => <p {...props}>{textAnimator(props.children)}</p>,
    li: ({ node, ...props }: any) => (
      <li {...props} style={ANIMATION_STYLE}>
        {textAnimator(props.children)}
      </li>
    ),

    strong: ({ node, ...props }: any) => <strong {...props}>{textAnimator(props.children)}</strong>,
    em: ({ node, ...props }: any) => <em {...props}>{textAnimator(props.children)}</em>,

    hr: ({ node, ...props }: any) => (
      <hr {...props} className="whitespace-pre-wrap" style={ANIMATION_STYLE} />
    ),

    table: ({ children, ref, node, ...props }) => {
      return (
        <div className="overflow-x-auto rounded-lg border border-border bg-material-thin">
          <table
            {...props}
            style={ANIMATION_STYLE}
            className="my-0 min-w-full divide-y divide-border text-sm"
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
          className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary"
        >
          {children}
        </th>
      )
    },
    tbody: ({ children, ref, node, ...props }) => {
      return (
        <tbody {...props} className="divide-y divide-border bg-material-ultra-thin">
          {children}
        </tbody>
      )
    },
    tr: ({ children, ref, node, ...props }) => {
      return (
        <tr {...props} className="transition-colors duration-150 hover:bg-material-thin">
          {textAnimator(children as any)}
        </tr>
      )
    },
    td: ({ children, ref, node, ...props }) => {
      return (
        <td {...props} className="whitespace-nowrap px-4 py-3 text-sm text-text">
          {textAnimator(children as any)}
        </td>
      )
    },
  } as Components
}

const animatedComponents = createAiMessageMarkdownElementsRender(true)
const staticComponents = createAiMessageMarkdownElementsRender(false)
export const MarkdownAnimateText: React.FC<MarkdownAnimateTextProps> = ({
  content,
  isStreaming,
}) => {
  const components = isStreaming ? animatedComponents : staticComponents

  return (
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
      {content}
    </ReactMarkdown>
  )
}

type BaseInlineFoloReferenceProps = {
  type: "entry" | "feed"
  id?: string
}
const InlineFoloReference: React.FC<
  BaseInlineFoloReferenceProps & {
    children?: React.ReactNode
    className?: string
    style?: React.CSSProperties
  }
> = ({ type, children, className, style, id }) => {
  const peekModal = usePeekModal()
  const navigateEntry = useNavigateEntry()

  const targetId = React.useMemo(() => {
    return (
      id ||
      React.Children.toArray(children)
        .map((child) => {
          if (typeof child === "string" || typeof child === "number") {
            return String(child)
          }
          return ""
        })
        .join("")
        .trim()
    )
  }, [id, children])

  const handleClick = React.useCallback(() => {
    if (!targetId) return

    if (type === "entry") {
      peekModal(targetId, "modal")
    } else {
      navigateEntry({ feedId: targetId, entryId: null })
    }
  }, [navigateEntry, peekModal, targetId, type])

  if (!targetId) return null

  const isEntry = type === "entry"
  const button = (
    <button
      type="button"
      aria-label={type === "entry" ? `Open entry ${targetId}` : `Open feed ${targetId}`}
      title={type === "entry" ? `Open entry ${targetId}` : `Open feed ${targetId}`}
      className={cn(
        "mx-[0.15em] inline-flex cursor-pointer items-center align-middle text-text-secondary opacity-80 transition-opacity hover:text-text hover:opacity-100",
        "-translate-y-0.5",
        className,
      )}
      style={style}
      onClick={handleClick}
    >
      {isEntry ? (
        <i className="i-mgc-docment-cute-re size-[1em]" />
      ) : (
        <i className="i-mgc-rss-2-cute-fi size-[1em]" />
      )}
    </button>
  )

  if (isEntry) {
    return (
      <EntryPreviewCard entryId={targetId} onNavigate={handleClick}>
        {button}
      </EntryPreviewCard>
    )
  } else {
    return (
      <FeedPreviewCard feedId={targetId} onNavigate={handleClick}>
        {button}
      </FeedPreviewCard>
    )
  }
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
      className="follow-link--underline cursor-pointer font-semibold text-text no-underline"
      onClick={() => {
        peekModal(entryId, "modal")
      }}
    >
      {children}
      <i className="i-mgc-arrow-right-up-cute-re size-[0.9em] translate-y-[2px] opacity-70" />
    </button>
  )
}
