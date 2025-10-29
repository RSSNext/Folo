import { Spring } from "@follow/components/constants/spring.js"
import type { CollapseCssRef } from "@follow/components/ui/collapse/CollapseCss.js"
import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/CollapseCss.js"
import { ShinyText } from "@follow/components/ui/shiny-text/ShinyText.js"
import { cn } from "@follow/utils"
import type { BizUITools } from "@folo-services/ai-tools"
import type { ReasoningUIPart, ToolUIPart } from "ai"
import { isToolUIPart } from "ai"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { ToolInvocationComponent } from "../message/ToolInvocationComponent"
import { AIReasoningPart } from "./AIReasoningPart"

export type ChainReasoningPart = ReasoningUIPart | ToolUIPart<BizUITools>
interface AIChainOfThoughtProps {
  groups: ReadonlyArray<ChainReasoningPart>
  isStreaming?: boolean
  className?: string
}
export const AIChainOfThought: React.FC<AIChainOfThoughtProps> = React.memo(
  ({ groups, isStreaming, className }) => {
    const collapseId = React.useId()

    const collapseRef = React.useRef<CollapseCssRef>(null)

    const currentChainReasoningIsFinished = React.useMemo(() => {
      let allDone = true
      for (const part of groups) {
        if (isToolUIPart(part)) {
          continue
        }
        if (part.state !== "done") {
          allDone = false
          break
        }
      }

      return allDone
    }, [groups])
    const currentReasoningTitle = React.useMemo(() => {
      if (!isStreaming) return null

      const lastPart = groups.at?.(-1)

      if (!lastPart) return null

      if (isToolUIPart(lastPart)) {
        return `Calling [${lastPart.type.replace("tool-", "")}]`
      }

      const lastPartText = lastPart.text
      return extractHeading(lastPartText)
    }, [groups, isStreaming])

    React.useEffect(() => {
      if (currentChainReasoningIsFinished) collapseRef.current?.setIsOpened(false)
    }, [collapseRef, currentChainReasoningIsFinished])

    if (!groups || groups.length === 0) return null

    return (
      <div
        className={cn(
          "w-[calc(var(--ai-chat-message-container-width,65ch))] min-w-0 border-border text-left",
          className,
        )}
      >
        <CollapseCssGroup>
          <CollapseCss
            ref={collapseRef}
            hideArrow
            collapseId={collapseId}
            defaultOpen={!currentChainReasoningIsFinished}
            title={
              <div className="group flex h-6 w-[calc(var(--ai-chat-message-container-width,65ch))] min-w-0 flex-1 items-center py-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-secondary">
                    {!currentChainReasoningIsFinished ? (
                      <span className="flex items-center gap-2">
                        Thinking:{" "}
                        <span className="min-w-0 truncate">
                          <AnimatePresence initial={false} mode="popLayout">
                            <m.span
                              key={currentReasoningTitle ?? "empty"}
                              initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                              transition={Spring.presets.smooth}
                              className="inline-block"
                            >
                              <ShinyText className="font-medium">
                                {currentReasoningTitle ?? ""}
                              </ShinyText>
                            </m.span>
                          </AnimatePresence>
                        </span>
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
              <div aria-hidden className="absolute inset-y-2 left-2 border-l border-fill" />
              {groups.map((part, index) => {
                const innerCollapseId = `${collapseId}-${index}`
                if (isToolUIPart(part)) {
                  return (
                    <ToolInvocationComponent variant="loose" key={innerCollapseId} part={part} />
                  )
                }
                const mergedText = part.text

                const title = extractHeading(part.text)
                const groupStreaming = part.state === "streaming"

                return (
                  <div key={innerCollapseId} className="relative pb-3 pl-8 last:pb-0">
                    <div aria-hidden className={"absolute left-2 top-2 size-2 -translate-x-1/2"}>
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
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {title ? (
              <span className="truncate">
                {"Reason: "}
                <span className="font-medium text-text">{title}</span>
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
