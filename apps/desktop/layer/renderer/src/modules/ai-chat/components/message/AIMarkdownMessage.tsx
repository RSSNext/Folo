import type { LinkProps } from "@follow/components/ui/link/LinkWithTooltip.js"
import { parseMarkdown } from "@follow/components/utils/parse-markdown.js"
import { cn, isBizId } from "@follow/utils"
import {
  createElement,
  isValidElement,
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"

import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { MarkdownLink } from "~/components/ui/markdown/renderers/MarkdownLink"
import { usePeekModal } from "~/hooks/biz/usePeekModal"

import { animatedPlugin } from "./animatedPlugin"

// Buffer configuration interface
interface BufferConfig {
  minBufferSize: number
  maxBufferSize: number // Maximum buffer size to prevent OOM
  maxBufferTime: number
  semanticTimeout: number
  emergencyTimeout: number
}

// Buffer endpoint patterns by priority
const BUFFER_ENDPOINTS = {
  HIGH_PRIORITY: [
    /\n\n/g, // Paragraph breaks
    /\n```\w*\n/g, // Code block boundaries
    /\n-{2,}\n/g, // Horizontal rules
    /[.!?]\s+/g, // Sentence endings with space
    /\n[-*+]\s/g, // List items
    /\n\d+\.\s/g, // Numbered lists
  ],
  MEDIUM_PRIORITY: [
    /[,:;]\s/g, // Clause boundaries
    /[)\]]\s/g, // Closing brackets with space
    /\n(?!\n)/g, // Single line breaks
  ],
  LOW_PRIORITY: [/\s/g], // Any whitespace
} as const

// Streaming message buffer class for external state management
class StreamingMessageBuffer {
  private displayedText = ""
  private bufferedText = ""
  private lastFlushTime = Date.now()
  private flushTimeoutId: ReturnType<typeof setTimeout> | null = null
  private subscribers = new Set<() => void>()
  private config: BufferConfig

  constructor(config: BufferConfig) {
    this.config = config
  }

  // Subscribe to state changes
  subscribe = (callback: () => void) => {
    this.subscribers.add(callback)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  // Get current displayed text snapshot
  getSnapshot = () => {
    return this.displayedText
  }

  // Notify all subscribers of state change
  private notify = () => {
    this.subscribers.forEach((callback) => callback())
  }

  // Find last endpoint of given priority in text
  private findLastEndpoint = (text: string, priority: keyof typeof BUFFER_ENDPOINTS): number => {
    const patterns = BUFFER_ENDPOINTS[priority]
    let lastIndex = -1

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)]
      if (matches.length > 0) {
        const lastMatch = matches.at(-1)
        if (lastMatch?.index !== undefined) {
          lastIndex = Math.max(lastIndex, lastMatch.index + lastMatch[0].length)
        }
      }
    }

    return lastIndex
  }

  // Determine optimal flush point in buffered text
  private determineFlushPoint = (bufferedText: string): number => {
    // Try high priority endpoints first
    const highPriorityPoint = this.findLastEndpoint(bufferedText, "HIGH_PRIORITY")
    if (highPriorityPoint > 0) return highPriorityPoint

    // Try medium priority endpoints
    const mediumPriorityPoint = this.findLastEndpoint(bufferedText, "MEDIUM_PRIORITY")
    if (mediumPriorityPoint > 0) return mediumPriorityPoint

    // Try low priority endpoints
    const lowPriorityPoint = this.findLastEndpoint(bufferedText, "LOW_PRIORITY")
    if (lowPriorityPoint > 0) return lowPriorityPoint

    // Flush entire buffer if no endpoints found
    return bufferedText.length
  }

  // Check if buffer should be flushed
  private shouldFlushBuffer = (bufferedText: string): boolean => {
    const now = Date.now()
    const timeSinceLastFlush = now - this.lastFlushTime

    // Emergency timeout - always flush
    if (timeSinceLastFlush > this.config.emergencyTimeout) return true

    // Buffer size limit - prevent OOM
    if (bufferedText.length > this.config.maxBufferSize) return true

    // Minimum buffer size not met
    if (bufferedText.length < this.config.minBufferSize) return false

    // Check for high priority endpoints (immediate flush)
    if (this.findLastEndpoint(bufferedText, "HIGH_PRIORITY") > 0) return true

    // Check for medium priority endpoints with time condition
    if (
      this.findLastEndpoint(bufferedText, "MEDIUM_PRIORITY") > 0 &&
      timeSinceLastFlush > this.config.maxBufferTime
    ) {
      return true
    }

    // Semantic timeout for incomplete sentences
    if (timeSinceLastFlush > this.config.semanticTimeout) {
      return this.findLastEndpoint(bufferedText, "LOW_PRIORITY") > 0
    }

    return false
  }

  // Emergency flush timer
  private scheduleEmergencyFlush = () => {
    if (this.flushTimeoutId) return

    this.flushTimeoutId = setTimeout(() => {
      this.displayedText += this.bufferedText
      this.bufferedText = ""
      this.lastFlushTime = Date.now()
      this.flushTimeoutId = null
      this.notify()
    }, this.config.emergencyTimeout)
  }

  // Clear emergency flush timer
  private clearEmergencyFlush = () => {
    if (this.flushTimeoutId) {
      clearTimeout(this.flushTimeoutId)
      this.flushTimeoutId = null
    }
  }

  // Update text content
  updateText = (newText: string, isProcessing: boolean) => {
    // Safety check for undefined/null newText
    if (typeof newText !== "string") {
      return
    }

    if (!isProcessing) {
      // Immediate update when not processing
      this.displayedText = newText
      this.bufferedText = ""
      this.lastFlushTime = Date.now()
      this.clearEmergencyFlush()
      this.notify()
      return
    }

    // Calculate delta and update buffer
    const deltaText = newText.slice(this.displayedText.length + this.bufferedText.length)
    if (!deltaText) return

    const newBufferedText = this.bufferedText + deltaText

    // Check if we should flush
    if (this.shouldFlushBuffer(newBufferedText)) {
      const flushPoint = this.determineFlushPoint(newBufferedText)
      const textToFlush = newBufferedText.slice(0, flushPoint)
      const remainingBuffer = newBufferedText.slice(flushPoint)

      this.displayedText += textToFlush
      this.bufferedText = remainingBuffer
      this.lastFlushTime = Date.now()
      this.clearEmergencyFlush()

      if (remainingBuffer.length > 0) {
        this.scheduleEmergencyFlush()
      }

      this.notify()
    } else {
      this.bufferedText = newBufferedText
      this.scheduleEmergencyFlush()
    }
  }

  // Cleanup resources
  destroy = () => {
    this.clearEmergencyFlush()
    this.subscribers.clear()
  }
}

// Buffer configurations
const BUFFER_CONFIG = {
  minBufferSize: 10,
  maxBufferSize: 10000, // Prevent OOM with 10KB limit
  maxBufferTime: 100,
  semanticTimeout: 300,
  emergencyTimeout: 500,
} as const

// Hook to use streaming text buffer
const useStreamingTextBuffer = (text: string, isProcessing: boolean) => {
  const bufferRef = useRef<StreamingMessageBuffer | null>(null)

  // Initialize buffer if needed (only during processing)
  if (isProcessing && !bufferRef.current) {
    bufferRef.current = new StreamingMessageBuffer(BUFFER_CONFIG)
  }

  // Clean up buffer when not processing
  if (!isProcessing && bufferRef.current) {
    bufferRef.current.destroy()
    bufferRef.current = null
  }

  // Update buffer when text changes (only if processing)
  if (isProcessing && bufferRef.current) {
    bufferRef.current.updateText(text, isProcessing)
  }

  // Subscribe to buffer changes - always call the hook
  const displayedText = useSyncExternalStore(
    bufferRef.current?.subscribe || (() => () => {}),
    bufferRef.current?.getSnapshot || (() => text),
  )

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      bufferRef.current?.destroy()
      bufferRef.current = null
    }
  }, [])

  // Return text directly when not processing, buffered text when processing
  return isProcessing ? displayedText : text
}

// Custom hook for throttled markdown parsing during streaming
const useThrottledMarkdownParsing = (text: string, isProcessing: boolean) => {
  const lastParsedTextRef = useRef<string>("")
  const cachedResultRef = useRef<any>(null)
  const lastParseTimeRef = useRef<number>(0)

  const parseWithCache = useCallback(
    (content: string, shouldProcess: boolean) => {
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
      const result = baseAIMarkdownParser(content, isProcessing)

      lastParsedTextRef.current = content
      cachedResultRef.current = result
      lastParseTimeRef.current = now
      return result
    },
    [isProcessing],
  )

  return useMemo(() => {
    // For non-processing state, always parse immediately
    if (!isProcessing) {
      return parseWithCache(text, false)
    }

    // During processing, apply throttling logic
    return parseWithCache(text, true)
  }, [text, isProcessing, parseWithCache])
}

export const AIMarkdownStreamingMessage = memo(
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

    // Use intelligent streaming buffer for semantic text rendering
    const bufferedText = useStreamingTextBuffer(text, isProcessing ?? false)

    // Use deferred value for lower priority rendering during streaming
    const deferredText = useDeferredValue(bufferedText)

    // Use our optimized parsing hook with buffered text
    const parsedContent = useThrottledMarkdownParsing(
      // During streaming, use deferred buffered text for optimal rendering
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

export const AIMarkdownMessage = memo(
  ({ text, className }: { text: string; className?: string }) => {
    return (
      <div className={className}>{useMemo(() => baseAIMarkdownParser(text, false), [text])}</div>
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

function baseAIMarkdownParser(content: string, isProcessing: boolean) {
  return parseMarkdown(content, {
    rehypePlugins: isProcessing ? [animatedPlugin] : undefined,
    components: {
      pre: ({ children }) => {
        const props = isValidElement(children) && "props" in children && children.props

        if (props) {
          const { className, children } = props as any

          if (className && className.includes("language-") && typeof children === "string") {
            const language = className.replace("language-", "")
            const code = children

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
}
