import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/CollapseCss.js"
import { cn } from "@follow/utils"
import * as React from "react"

interface AIReasoningPartProps {
  text: string
  isStreaming?: boolean
  className?: string
}

export const AIReasoningPart: React.FC<AIReasoningPartProps> = React.memo(
  ({ text, isStreaming = false, className }) => {
    const collapseId = React.useMemo(() => `reasoning-${Math.random().toString(36).slice(2)}`, [])
    // Re-mount CollapseCssGroup when streaming state changes or when we need to force-open while streaming
    const [remountTick, setRemountTick] = React.useState(0)
    const groupKey = `${isStreaming ? "streaming" : "idle"}:${remountTick}`
    if (!text) return null

    return (
      <div className={cn("border-border min-w-0 max-w-full text-left", className)}>
        <div className="w-[calc(var(--ai-chat-layout-width,65ch))] max-w-full" />

        <CollapseCssGroup key={groupKey}>
          <div>
            <CollapseCss
              hideArrow
              collapseId={collapseId}
              defaultOpen={isStreaming}
              onOpenChange={(opened) => {
                // While streaming, keep it open and block manual collapse
                if (isStreaming && !opened) {
                  setRemountTick((x) => x + 1)
                }
              }}
              title={
                <div className="group/inner flex h-6 min-w-0 flex-1 items-center py-0">
                  <div className="text-text-secondary flex items-center gap-2 text-xs">
                    <i className="i-mgc-brain-cute-re" />
                    <span>{isStreaming ? "Reasoning..." : "Reasoning"}</span>
                  </div>
                  <div className="ml-2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/inner:opacity-100">
                    <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/inner:rotate-90" />
                  </div>
                </div>
              }
              className="group/inner w-full border-none"
              contentClassName="pb-0 pt-2"
            >
              <div className="text-xs">
                <pre className="text-text-secondary bg-material-medium overflow-x-auto whitespace-pre-wrap rounded p-3 text-[11px] leading-relaxed">
                  {text}
                </pre>
              </div>
            </CollapseCss>
          </div>
        </CollapseCssGroup>
      </div>
    )
  },
)

AIReasoningPart.displayName = "AIReasoningPart"
