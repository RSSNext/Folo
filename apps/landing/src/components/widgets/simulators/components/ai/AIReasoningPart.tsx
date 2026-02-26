import clsx from 'clsx'
import * as React from 'react'

interface AIReasoningPartProps {
  text: string
  isStreaming?: boolean
  className?: string
}

export const AIReasoningPart: React.FC<AIReasoningPartProps> = React.memo(
  ({ text, isStreaming, className }) => {
    const [renderedText, setRenderedText] = React.useState(text)
    const streamingTimerRef = React.useRef<number | null>(null)

    React.useEffect(() => {
      if (streamingTimerRef.current) {
        window.clearInterval(streamingTimerRef.current)
        streamingTimerRef.current = null
      }

      if (!isStreaming) {
        setRenderedText(text)
        return
      }

      if (!text) {
        setRenderedText('')
        return
      }

      const totalLength = text.length
      const chunkSize = Math.max(8, Math.ceil(totalLength / 70))
      let index = Math.min(chunkSize, totalLength)

      setRenderedText(text.slice(0, index))

      streamingTimerRef.current = window.setInterval(() => {
        index = Math.min(totalLength, index + chunkSize)
        setRenderedText(text.slice(0, index))

        if (index >= totalLength && streamingTimerRef.current) {
          window.clearInterval(streamingTimerRef.current)
          streamingTimerRef.current = null
        }
      }, 70)

      return () => {
        if (streamingTimerRef.current) {
          window.clearInterval(streamingTimerRef.current)
          streamingTimerRef.current = null
        }
      }
    }, [text, isStreaming])
    if (!text) return null
    return (
      <div className={clsx('min-w-0 max-w-full text-left', className)}>
        <div className="w-[calc(var(--ai-chat-message-container-width,65ch))] max-w-full" />
        <div className="text-xs">
          <pre className="text-text-secondary bg-material-medium overflow-x-auto whitespace-pre-wrap rounded p-3 text-[11px] leading-relaxed">
            {renderedText}
          </pre>
        </div>
      </div>
    )
  },
)

AIReasoningPart.displayName = 'AIReasoningPart'
