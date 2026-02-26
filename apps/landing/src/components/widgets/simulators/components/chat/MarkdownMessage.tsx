import { AIMarkdownStreamingMessage } from '../ai/AIMarkdownMessage'

export const MarkdownMessage = ({
  text,
  className,
  isStreaming,
}: {
  text: string
  className?: string
  isStreaming?: boolean
}) => {
  return (
    <AIMarkdownStreamingMessage
      text={text}
      className={className}
      isStreaming={isStreaming}
    />
  )
}
