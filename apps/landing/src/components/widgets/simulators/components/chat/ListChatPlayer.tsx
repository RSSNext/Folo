'use client'
import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import * as React from 'react'

import { AISpline } from '~/components/ui/3d-models/AISpline'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ScrollArea } from '~/components/ui/scroll-areas/ScrollArea'
import { cn } from '~/lib/cn'
import { sleep } from '~/lib/sleep'
import { Spring } from '~/lib/spring'

import type { AI_CHAT_STEP } from '../../mocks'
import type { ChainReasoningPart } from '../ai/AIChainOfThought'
import { AIChainOfThought } from '../ai/AIChainOfThought'
import { AiMessageContextBar } from './AiMessageContextBar'
import { AiUserMessage } from './AiUserMessage'
import { MarkdownMessage } from './MarkdownMessage'
import { streamText } from './stream'

const DownloadAppTip: React.FC = () => {
  return (
    <div className="max-w-full w-full flex text-sm text-text">
      <div className="flex items-start gap-2 whitespace-pre">
        <i
          className="i-mingcute-download-2-line mt-1.5 text-accent"
          aria-hidden
        />
        <div className="min-w-0">
          <div className="mt-1 text-text-secondary">
            Get the full experience on Desktop or try it on the Web.{' '}
            <Link href="/download" className="text-accent">
              Download
            </Link>{' '}
            or{' '}
            <Link
              href="https://app.folo.is"
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent"
            >
              Try the Web
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ListChatPlayerProps {
  steps: ReadonlyArray<AI_CHAT_STEP>
  initialTitle?: string
  rootClassName?: string
  scrollRootClassName?: string
  scrollViewportClassName?: string
  showChatPanelRightDownload?: boolean
  autoplay?: boolean
}

export const ListChatPlayer: React.FC<ListChatPlayerProps> = ({
  steps,
  initialTitle = 'Chat',
  rootClassName,
  scrollRootClassName,
  scrollViewportClassName,
  showChatPanelRightDownload = false,
  autoplay = true,
}) => {
  const [width, setWidth] = React.useState(0)
  const mainContainerRef = React.useRef<HTMLElement>(null)
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)
  const [title, setTitle] = React.useState(initialTitle)

  const [messages, setMessages] = React.useState<
    Array<{
      id: string
      role: 'user' | 'assistant'
      message?: string
      component?: React.ReactNode
      context?: any
      kind?: 'chain'
    }>
  >([])
  const [streamingText, setStreamingText] = React.useState<string>('')
  const [isStreaming, setIsStreaming] = React.useState(false)
  const streamHandleRef = React.useRef<ReturnType<typeof streamText> | null>(
    null,
  )
  const hasStartedRef = React.useRef(false)
  const idCounterRef = React.useRef(0)
  const chainMessageIdRef = React.useRef<string | null>(null)
  const [chainGroups, setChainGroups] = React.useState<ChainReasoningPart[]>([])
  const [chainStreaming, setChainStreaming] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')

  const canSend = !isStreaming && !chainStreaming

  const handleSend = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      const text = inputValue.trim()
      if (!text || !canSend) return
      const id1 = `m-${idCounterRef.current++}`
      const id2 = `m-${idCounterRef.current++}`
      setMessages((prev) => [
        ...prev,
        { id: id1, role: 'user', message: text },
        { id: id2, role: 'user', component: <DownloadAppTip /> },
      ])
      setInputValue('')
    },
    [canSend, inputValue],
  )

  React.useLayoutEffect(() => {
    const $ = mainContainerRef.current
    if (!$) return
    const handler = () => {
      setWidth($.getBoundingClientRect().width)
    }
    const resizeObserver = new ResizeObserver(handler)
    resizeObserver.observe($)
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Drive the chat sequentially by provided steps
  React.useEffect(() => {
    if (hasStartedRef.current || !autoplay) return
    hasStartedRef.current = true

    const run = async () => {
      for (const step of steps) {
        // cancel any previous streaming
        streamHandleRef.current?.cancel()
        streamHandleRef.current = null

        if (step.role === 'user') {
          const id = `m-${idCounterRef.current++}`
          const anyStep = step as unknown as {
            message?: string
            component?: React.ReactNode
            context?: any
          }
          setMessages((prev) => [
            ...prev,
            {
              id,
              role: 'user',
              message: anyStep.message,
              component: anyStep.component,
              context: anyStep.context,
            },
          ])
          await sleep(600)
          continue
        }

        // action step: set-title
        if ((step as any).role === 'action') {
          const action = step as {
            role: 'action'
            type: 'set-title'
            title: string
          }
          if (action.type === 'set-title') setTitle(action.title)
          await sleep(100)
          continue
        }

        const anyStep = step as unknown as {
          type?: string
          message?: string
          component?: React.ReactNode
          data?: { toolName: string; input: string; output: string }
        }

        // assistant component without text
        if (anyStep.component && !anyStep.message) {
          const id = `m-${idCounterRef.current++}`
          setMessages((prev) => [
            ...prev,
            { id, role: 'assistant', component: anyStep.component },
          ])
          await sleep(400)
          continue
        }

        // tool invocation step -> render chain container and append tool group
        if (anyStep.type === 'tool-invocation' && anyStep.data) {
          if (!chainMessageIdRef.current) {
            const id = `m-${idCounterRef.current++}`
            chainMessageIdRef.current = id
            setMessages((prev) => [
              ...prev,
              { id, role: 'assistant', kind: 'chain' },
            ])
          }
          const tool = anyStep.data!
          setChainGroups((prev) => [
            ...prev,
            {
              type: `tool-${tool.toolName}`,
              toolCallId: 'mock-tool-call',
              input: tool.input,
              output: tool.output,
              state: 'output-available',
            } as any,
          ])
          await sleep(400)
          continue
        }

        // reasoning step -> ensure chain container and stream
        if (
          anyStep.type === 'reasoning' &&
          typeof (step as any).text === 'string'
        ) {
          if (!chainMessageIdRef.current) {
            const id = `m-${idCounterRef.current++}`
            chainMessageIdRef.current = id
            setMessages((prev) => [
              ...prev,
              { id, role: 'assistant', kind: 'chain' },
            ])
          }
          const text = (step as any).text as string
          setChainStreaming(true)
          setChainGroups((prev) => [
            ...prev,
            { type: 'reasoning', state: 'streaming', text } as any,
          ])
          // wait proportional to text length
          await sleep(
            Math.min(2000, Math.max(500, Math.round(text.length * 3.5))),
          )
          // mark last as done
          setChainGroups((prev) => {
            const next = [...prev]
            const last = next.pop() as any
            if (last && last.type === 'reasoning') {
              next.push({ ...last, state: 'done' })
            } else if (last) {
              next.push(last)
            }
            return next
          })
          setChainStreaming(false)
          continue
        }

        // assistant markdown/message streaming
        if (anyStep.message && (anyStep.type === 'markdown' || !anyStep.type)) {
          const fullText = anyStep.message
          setIsStreaming(true)
          setStreamingText('')
          await sleep(100)

          streamHandleRef.current = streamText(fullText, {
            onUpdate: setStreamingText,
            intervalMs: 70,
            initialDelayMs: 0,
          })
          await streamHandleRef.current.done
          setIsStreaming(false)
          const id = `m-${idCounterRef.current++}`
          setMessages((prev) => [
            ...prev,
            { id, role: 'assistant', message: fullText },
          ])
          setStreamingText('')
          await sleep(500)
        }
      }
    }

    void run().then(() => {
      // if (inputRef.current) {
      //   inputRef.current.focus()
      // }
    })

    return () => {
      streamHandleRef.current?.cancel()
    }
  }, [autoplay, steps])

  // Auto scroll to bottom when messages/streaming updates
  React.useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    if (typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, streamingText])

  return (
    <div className={rootClassName}>
      <header className="px-3 py-2 border-b flex items-center gap-2">
        <AISpline className="size-9 absolute" />
        <h1
          className="truncate font-bold text-text animate-mask-left-to-right [--animation-duration:1s]"
          key={title}
        >
          <span className="ml-10">{title}</span>
        </h1>

        {/* Download App Tip */}
        {showChatPanelRightDownload ? (
          <Button
            variant="ghost"
            className="ml-auto p-1 rounded"
            onClick={() => {
              window.open('/download', '_blank')
            }}
          >
            <i className="i-mingcute-download-2-line" />
            <span className="sr-only">Download</span>
          </Button>
        ) : null}
      </header>

      <ScrollArea
        ref={viewportRef}
        rootClassName={scrollRootClassName ?? 'h-0 grow'}
        viewportClassName={scrollViewportClassName ?? 'px-3 min-w-0'}
        flex
      >
        <main
          ref={mainContainerRef}
          className="my-4"
          style={{
            ['--ai-chat-message-container-width' as any]: `${width}px`,
          }}
        >
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <m.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={Spring.presets.smooth}
                    className="relative flex flex-col gap-3 mt-4"
                  >
                    {msg.component ? (
                      <div className="flex flex-col">
                        {msg.context && (
                          <AiMessageContextBar context={msg.context} />
                        )}
                        <div className="flex flex-col items-end mb-4">
                          {msg.component}
                        </div>
                      </div>
                    ) : (
                      <AiUserMessage
                        userMessage={msg.message ?? ''}
                        context={msg.context}
                      />
                    )}
                  </m.div>
                )
              }

              return (
                <div key={msg.id} className="min-w-0 flex flex-col gap-3">
                  {msg.kind === 'chain' ? (
                    <AIChainOfThought
                      groups={chainGroups}
                      isStreaming={chainStreaming}
                    />
                  ) : msg.component ? (
                    <>{msg.component}</>
                  ) : msg.message ? (
                    <MarkdownMessage text={msg.message} />
                  ) : null}
                </div>
              )
            })}
          </AnimatePresence>

          {isStreaming && streamingText ? (
            <m.div
              key="assistant-streaming"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={Spring.presets.smooth}
              className="min-w-0 flex flex-col gap-3"
            >
              <MarkdownMessage text={streamingText} isStreaming />
            </m.div>
          ) : null}
        </main>
      </ScrollArea>

      <form
        onSubmit={handleSend}
        className="p-3 border-t bg-background/60 backdrop-blur"
      >
        <Input
          className="rounded-lg"
          inputClassName="rounded-lg"
          placeholder={'Ask Folo anything…'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          ref={inputRef}
          endAdornment={
            <button
              type="button"
              className={cn(
                'inline-flex select-none items-center justify-center outline-offset-2 active:transition-none disabled:cursor-not-allowed disabled:ring-0 align-middle focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 text-sm font-semibold ring-0! hover:contrast-[1.10] hover:shadow-md hover:shadow-accent/20 active:contrast-125 active:shadow-none disabled:bg-theme-disabled disabled:dark:text-zinc-50 disabled:shadow-none focus-visible:ring-accent/30 text-zinc-50 size-8 rounded-xl p-0 transition-all duration-300 active:scale-95 disabled:bg-disabled-control cursor-not-allowed backdrop-blur-sm bg-accent',
                'size-6',
                'rounded-lg',
              )}
              disabled={!inputValue.trim() || !canSend}
              onClick={handleSend}
            >
              <span className="contents">
                <span className="flex items-center justify-center">
                  <i className="i-mingcute-send-plane-fill size-3.5 text-white" />
                </span>
              </span>
            </button>
          }
          endAdornmentVisibility="always"
        />
      </form>
    </div>
  )
}
