import type { CollapseCssRef } from "@follow/components/ui/collapse/CollapseCss.js"
import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/CollapseCss.js"
import { cn } from "@follow/utils"
import type { ReasoningUIPart } from "ai"
import * as React from "react"

import { AIReasoningPart } from "./AIReasoningPart"

interface AIChainOfThoughtProps {
  groups: ReadonlyArray<ReasoningUIPart>
  isStreaming?: boolean
  className?: string
}
export const AIChainOfThought: React.FC<AIChainOfThoughtProps> = React.memo(
  ({ groups, isStreaming, className }) => {
    const collapseId = React.useMemo(() => `chain-${Math.random().toString(36).slice(2)}`, [])

    const collapseRef = React.useRef<CollapseCssRef>(null)
    const lastPartText = groups.at?.(-1)?.text
    const currentChainReasoningIsFinished = React.useMemo(() => {
      return groups.every((part) => part.state === "done")
    }, [groups])
    const currentReasoningTitle = React.useMemo(() => {
      if (!isStreaming) return null
      return extractHeading(lastPartText)
    }, [isStreaming, lastPartText])

    React.useEffect(() => {
      collapseRef.current?.setIsOpened(!currentChainReasoningIsFinished)
    }, [collapseRef, currentChainReasoningIsFinished])

    if (!groups || groups.length === 0) return null

    return (
      <div className={cn("border-border min-w-0 max-w-full text-left", className)}>
        <div className="w-[calc(var(--ai-chat-layout-width,65ch))] max-w-full" />

        <CollapseCssGroup>
          <CollapseCss
            ref={collapseRef}
            hideArrow
            collapseId={collapseId}
            defaultOpen={!currentChainReasoningIsFinished}
            title={
              <div className="group flex h-6 min-w-0 flex-1 items-center py-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-secondary">
                    {!currentChainReasoningIsFinished ? (
                      <span>
                        Thinking: <span className="font-medium">{currentReasoningTitle}</span>
                      </span>
                    ) : (
                      "Finished Thinking"
                    )}
                  </span>
                </div>
                <div className="ml-2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                </div>
              </div>
            }
            className="group w-full border-none"
            contentClassName="pb-2 pt-1"
          >
            <div className="relative">
              <div aria-hidden className="border-fill absolute inset-y-0 left-2 border-l" />
              {groups.map((part, index) => {
                const mergedText = part.text

                const title = extractHeading(part.text)
                const groupStreaming = part.state === "streaming"

                const innerCollapseId = `${collapseId}-${index}`

                return (
                  <div key={innerCollapseId} className="relative pb-3 pl-8 last:pb-0">
                    <div
                      aria-hidden
                      className={cn(
                        "absolute left-2 top-2 size-2 -translate-x-1/2 rounded-full border",
                        groupStreaming ? "border-accent bg-accent" : "border-fill bg-fill-vibrant",
                      )}
                    >
                      <i className="i-mgc-brain-cute-re absolute top-1/2 -translate-x-1/4 -translate-y-1/2" />
                    </div>

                    <AIInnerReasoningPart
                      title={title}
                      text={mergedText}
                      groupStreaming={groupStreaming}
                    />
                  </div>
                )
              })}
            </div>
          </CollapseCss>
        </CollapseCssGroup>
      </div>
    )
  },
)

const AIInnerReasoningPart: React.FC<{
  title: string | undefined
  text: string
  groupStreaming: boolean
}> = React.memo(({ title, text, groupStreaming }) => {
  const id = React.useId()
  const collapseRef = React.useRef<CollapseCssRef>(null)

  React.useEffect(() => {
    collapseRef.current?.setIsOpened(groupStreaming)
  }, [groupStreaming, collapseRef])

  return (
    <CollapseCss
      ref={collapseRef}
      hideArrow
      collapseId={id}
      defaultOpen
      title={
        <div className="group/inner flex h-6 min-w-0 flex-1 items-center py-0">
          <div className="text-text-secondary flex items-center gap-2 text-xs">
            {title ? (
              <span className="truncate">
                {"Reason: "}
                <span className="text-text font-medium">{title}</span>
              </span>
            ) : (
              <span>{groupStreaming ? "Reasoning..." : "Reasoning"}</span>
            )}
          </div>
          <div className="ml-2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/inner:opacity-100">
            <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/inner:rotate-90" />
          </div>
        </div>
      }
      className="group/inner w-full border-none"
    >
      <AIReasoningPart text={text} isStreaming={groupStreaming} />
    </CollapseCss>
  )
})

AIChainOfThought.displayName = "AIChainOfThought"

const extractHeading = (text?: string): string | undefined => {
  if (!text) return
  const lines = text.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith("#")) {
      let idx = 0
      while (idx < line.length && line.charAt(idx) === "#") idx++
      let content = line.slice(idx).trim()
      while (content.endsWith("#")) content = content.slice(0, -1).trim()
      return content || undefined
    }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      return line.slice(2, -2).trim() || undefined
    }
    break
  }
  return
}
