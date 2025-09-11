import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/index.js"
import { JsonHighlighter } from "@follow/components/ui/json-highlighter/index.js"
import type { ToolUIPart } from "ai"
import { getToolName } from "ai"
import * as React from "react"

interface ToolInvocationComponentProps {
  part: ToolUIPart
}

export const ToolInvocationComponent: React.FC<ToolInvocationComponentProps> = React.memo(
  ({ part }) => {
    const toolName = getToolName(part)
    const hasError = "errorText" in part && part.errorText
    const hasResult = "output" in part && part.output
    const hasArgs = "input" in part && part.input

    // Generate a unique value for this accordion item
    const accordionValue = `tool-${"toolCallId" in part ? part.toolCallId : Math.random()}`

    return (
      <div
        className={`min-w-0 max-w-full text-left ${hasError ? "border-red/30" : "border-border"}`}
      >
        <div className="max-w-[calc(var(--ai-chat-layout-width,65ch)] w-[9999px]" />

        <div className="w-full">
          <CollapseCssGroup>
            <CollapseCss
              collapseId={accordionValue}
              hideArrow
              className="group border-none"
              title={
                <div className="group flex h-6 min-w-0 flex-1 items-center justify-between py-0">
                  <div className="flex items-center gap-2 text-xs">
                    <i
                      className={hasError ? "i-mgc-close-cute-re text-red" : "i-mgc-tool-cute-re"}
                    />
                    <span className="text-text-secondary">
                      {hasError ? "Tool Failed:" : "Tool Called:"}
                    </span>
                    <h4 className={`truncate font-medium ${hasError ? "text-red" : "text-text"}`}>
                      {toolName}
                    </h4>
                  </div>

                  {/* Custom arrow that only shows on hover */}
                  <div className="ml-auto flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </div>
                </div>
              }
              contentClassName="pb-0 pt-2"
            >
              <div className="space-y-2 text-xs">
                {/* Show tool arguments if available */}
                {hasArgs ? (
                  <div>
                    <div className="text-text-secondary mb-1 font-medium">Arguments:</div>
                    <JsonHighlighter
                      className="text-text-tertiary bg-fill-secondary overflow-x-auto rounded p-2 text-[11px]"
                      json={JSON.stringify(part.input, null, 2)}
                    />
                  </div>
                ) : null}

                {/* Show tool result if available */}
                {hasResult ? (
                  <div>
                    <div className="text-text-secondary mb-1 font-medium">Result:</div>
                    <JsonHighlighter
                      className="text-text-tertiary bg-fill-secondary overflow-x-auto rounded p-2 text-[11px]"
                      json={JSON.stringify(part.output, null, 2)}
                    />
                  </div>
                ) : null}

                {/* Show error if available */}
                {hasError && "errorText" in part ? (
                  <div>
                    <div className="text-red mb-1 font-medium">Error:</div>
                    <pre className="text-red bg-red/10 overflow-x-auto rounded p-2 text-[11px]">
                      {String(part.errorText)}
                    </pre>
                  </div>
                ) : null}
              </div>
            </CollapseCss>
          </CollapseCssGroup>
        </div>
      </div>
    )
  },
)
