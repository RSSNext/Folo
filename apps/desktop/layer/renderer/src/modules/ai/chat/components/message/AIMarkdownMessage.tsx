import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { cn, isBizId } from "@follow/utils"
import {
  createElement,
  isValidElement,
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
} from "react"

import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { MermaidDiagram } from "~/components/ui/diagrams"
import { MarkdownLink } from "~/components/ui/markdown/renderers/MarkdownLink"
import { usePeekModal } from "~/hooks/biz/usePeekModal"

// Custom hook for throttled markdown parsing during streaming
const useThrottledMarkdownParsing = (text: string, isProcessing: boolean) => {
  const lastParsedTextRef = useRef<string>("")
  const cachedResultRef = useRef<any>(null)
  const lastParseTimeRef = useRef<number>(0)

  const parseWithCache = useCallback((content: string, shouldProcess: boolean) => {
    const now = Date.now()

    // During streaming, throttle parsing
    if (shouldProcess && cachedResultRef.current) {
      const timeSinceLastParse = now - lastParseTimeRef.current
      if (timeSinceLastParse < 16) {
        // Return cached result if within throttle window
        return cachedResultRef.current
      }
    }

    // If content hasn't changed, return cached result
    if (content === lastParsedTextRef.current && cachedResultRef.current) {
      return cachedResultRef.current
    }

    // Parse and cache the result
    const result = parseMarkdown(content, {
      components: {
        pre: ({ children }) => {
          const props = isValidElement(children) && "props" in children && children.props

          if (props) {
            const { className, children } = props as any

            if (className && className.includes("language-") && typeof children === "string") {
              const language = className.replace("language-", "")
              const code = children

              // Render Mermaid diagrams - skip during processing for performance
              if (language === "mermaid") {
                return <MermaidDiagram code={code} shouldRender={!shouldProcess} />
              }

              return <ShikiHighLighter code={code} language={language} showCopy />
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

    lastParsedTextRef.current = content
    cachedResultRef.current = result
    lastParseTimeRef.current = now
    return result
  }, [])

  return useMemo(() => {
    // For non-processing state, always parse immediately
    if (!isProcessing) {
      return parseWithCache(text, false)
    }

    // During processing, apply throttling logic
    return parseWithCache(text, true)
  }, [text, isProcessing, parseWithCache])
}

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
    const className = `prose dark:prose-invert text-sm
  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-base prose-h6:text-sm
  prose-li:list-disc prose-li:marker:text-accent prose-hr:border-border prose-hr:mx-8`

    // Use deferred value for lower priority rendering during streaming
    const deferredText = useDeferredValue(text)

    // Use our optimized parsing hook
    const parsedContent = useThrottledMarkdownParsing(
      // During streaming, use deferred text for non-urgent updates
      isProcessing ? deferredText : text,
      isProcessing ?? false,
    )

    return <div className={cn(className, classNameProp)}>{parsedContent}</div>
  },
  // Enhanced memo comparison for better performance
  (prevProps, nextProps) => {
    // If not processing, do normal comparison
    if (!nextProps.isProcessing && !prevProps.isProcessing) {
      return (
        prevProps.text === nextProps.text &&
        prevProps.className === nextProps.className &&
        prevProps.isProcessing === nextProps.isProcessing
      )
    }

    // During processing, be more lenient with text changes to reduce re-renders
    if (nextProps.isProcessing) {
      // Only re-render if there's a significant change or processing state changes
      return (
        prevProps.text === nextProps.text &&
        prevProps.className === nextProps.className &&
        prevProps.isProcessing === nextProps.isProcessing
      )
    }

    // Default comparison
    return false
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
