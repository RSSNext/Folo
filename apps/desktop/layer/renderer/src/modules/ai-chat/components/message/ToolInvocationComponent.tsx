import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/index.js"
import { JsonHighlighter } from "@follow/components/ui/json-highlighter/index.js"
import type { ToolUIPart } from "ai"
import { getToolName } from "ai"
import clsx from "clsx"
import * as React from "react"
import { titleCase } from "title-case"

interface ToolInvocationComponentProps {
  part: ToolUIPart

  variant: "loose" | "tight"
}

export const ToolInvocationComponent: React.FC<ToolInvocationComponentProps> = React.memo(
  ({ part, variant }) => {
    const toolName = titleCase(getToolName(part).replaceAll("_", " "))

    const hasError = "errorText" in part && part.errorText
    const hasResult = "output" in part && part.output
    const hasArgs = "input" in part && part.input

    const isCalling = part.state === "input-streaming"

    // Generate a unique value for this accordion item
    const accordionValue = `tool-${"toolCallId" in part ? part.toolCallId : Math.random()}`

    const result = React.useMemo(() => {
      if (hasResult) {
        const string = JSON.stringify(part.output, null, 2)
        if (string.length > 1000) {
          return `${string.slice(0, 1000)}\n...`
        } else {
          return string
        }
      }
    }, [hasResult, part])

    return (
      <div className={clsx("relative pl-8 last:pb-0", variant === "tight" ? "pb-0" : "pb-3")}>
        <div
          aria-hidden
          className={`absolute left-2 top-2 size-2 -translate-x-1/2 ${hasError ? "text-red" : ""}`}
        >
          <i className={`i-mgc-tool-cute-re absolute top-1/2 -translate-x-1/4 -translate-y-1/2`} />
        </div>

        <CollapseCssGroup>
          <CollapseCss
            collapseId={accordionValue}
            hideArrow
            className="group/collapse border-none"
            title={
              <div className="group/tool flex h-6 min-w-0 flex-1 items-center py-0">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>
                    {hasError ? "Tool Failed:" : isCalling ? "Tool Calling:" : "Tool Called:"}
                  </span>
                  <span className={`truncate font-medium ${hasError ? "text-red" : "text-text"}`}>
                    {toolName}
                  </span>
                </div>
                <div className="ml-2 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover/tool:opacity-100">
                  <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]/collapse:rotate-90" />
                </div>
              </div>
            }
            contentClassName="pb-0 pt-2"
          >
            <div className="space-y-2 text-xs">
              {/* Show tool arguments if available */}
              {hasArgs ? (
                <div>
                  <div className="mb-1 font-medium text-text-secondary">Arguments:</div>
                  <JsonHighlighter
                    className="overflow-x-auto rounded bg-fill-secondary p-2 text-[11px] text-text-tertiary"
                    json={JSON.stringify(part.input, null, 2)}
                  />
                </div>
              ) : null}

              {/* Show tool result if available */}
              {hasResult ? (
                <div>
                  <div className="mb-1 font-medium text-text-secondary">Result:</div>
                  <JsonHighlighter
                    className="overflow-x-auto rounded bg-fill-secondary p-2 text-[11px] text-text-tertiary"
                    json={result!}
                  />
                </div>
              ) : null}

              {/* Show error if available */}
              {hasError && "errorText" in part ? (
                <div>
                  <div className="mb-1 font-medium text-red">Error:</div>
                  <pre className="overflow-x-auto rounded bg-red/10 p-2 text-[11px] text-red">
                    {String(part.errorText)}
                  </pre>
                </div>
              ) : null}
            </div>
          </CollapseCss>
        </CollapseCssGroup>
      </div>
    )
  },
)
