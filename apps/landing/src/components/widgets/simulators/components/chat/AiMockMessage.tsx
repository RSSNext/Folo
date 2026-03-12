import type { ReasoningUIPart, ToolUIPart } from 'ai'
import * as React from 'react'

import type { AI_CHAT_STEP } from '../../mocks'
import { AI_SUMMARY_STEPS } from '../../mocks'
import type { ChainReasoningPart } from '../ai/AIChainOfThought'
import { AIChainOfThought } from '../ai/AIChainOfThought'
import { MarkdownMessage } from './MarkdownMessage'
import { streamText } from './stream'

interface AiMockMessageProps {
  showToolInvocation?: boolean
  visibleReasoningCount?: number
  isReasoningStreaming?: boolean
  showMarkdown?: boolean
  isMarkdownStreaming?: boolean
  steps?: ReadonlyArray<AI_CHAT_STEP>
  onMarkdownDone?: () => void
}

export const AiMockMessage: React.FC<AiMockMessageProps> = ({
  showToolInvocation = false,
  visibleReasoningCount = 0,
  isReasoningStreaming = false,
  showMarkdown = false,
  isMarkdownStreaming = false,
  steps,
  onMarkdownDone,
}) => {
  const [streamingText, setStreamingText] = React.useState<string>('')
  const streamHandleRef = React.useRef<ReturnType<typeof streamText> | null>(
    null,
  )
  const stepsSource = React.useMemo(
    () => (steps && steps.length > 0 ? steps : AI_SUMMARY_STEPS),
    [steps],
  )

  React.useEffect(() => {
    streamHandleRef.current?.cancel()
    streamHandleRef.current = null

    if (!showMarkdown) {
      setStreamingText('')
      return
    }

    const markdownStep = stepsSource.find(
      (s) => s.role === 'assistant' && s.type === 'markdown',
    ) as { role: 'assistant'; type: 'markdown'; message: string } | undefined
    const fullText = markdownStep?.message ?? ''

    if (!isMarkdownStreaming) {
      setStreamingText(fullText)
      onMarkdownDone?.()
      return
    }

    setStreamingText('')

    streamHandleRef.current = streamText(fullText, {
      onUpdate: setStreamingText,
      intervalMs: 70,
      initialDelayMs: 0,
      onDone: () => onMarkdownDone?.(),
    })

    return () => {
      streamHandleRef.current?.cancel()
      streamHandleRef.current = null
    }
  }, [showMarkdown, isMarkdownStreaming, stepsSource, onMarkdownDone])

  const reasoningGroups = React.useMemo<ChainReasoningPart[]>(() => {
    const groups: ChainReasoningPart[] = []

    // Tool invocation step from summary steps
    if (showToolInvocation) {
      const toolStep = stepsSource.find(
        (s) => s.role === 'assistant' && s.type === 'tool-invocation',
      ) as
        | {
            role: 'assistant'
            type: 'tool-invocation'
            data: { toolName: string; input: string; output: string }
          }
        | undefined

      if (toolStep) {
        const toolGroup: ToolUIPart = {
          type: `tool-${toolStep.data.toolName}`,
          toolCallId: 'mock-tool-call',
          input: toolStep.data.input,
          output: toolStep.data.output,
          state: 'output-available',
        }
        groups.push(toolGroup)
      }
    }

    // Reasoning steps
    if (visibleReasoningCount) {
      const allReasoning = stepsSource.filter(
        (s) => s.role === 'assistant' && s.type === 'reasoning',
      ) as Array<{ role: 'assistant'; type: 'reasoning'; text: string }>

      const selected = allReasoning.slice(0, visibleReasoningCount)

      groups.push(
        ...selected.map((step, index, arr) => {
          const isLast = index === arr.length - 1
          const state: ReasoningUIPart['state'] =
            isLast && isReasoningStreaming ? 'streaming' : 'done'
          return {
            type: 'reasoning',
            state,
            text: step.text,
          } as ReasoningUIPart
        }),
      )
    }

    return groups
  }, [
    showToolInvocation,
    visibleReasoningCount,
    isReasoningStreaming,
    stepsSource,
  ])

  return (
    <div className="min-w-0 flex flex-col gap-3">
      {reasoningGroups.length > 0 ? (
        <AIChainOfThought
          groups={reasoningGroups}
          isStreaming={isReasoningStreaming}
        />
      ) : null}

      {showMarkdown ? (
        <MarkdownMessage
          text={streamingText}
          isStreaming={isMarkdownStreaming}
        />
      ) : null}
    </div>
  )
}
