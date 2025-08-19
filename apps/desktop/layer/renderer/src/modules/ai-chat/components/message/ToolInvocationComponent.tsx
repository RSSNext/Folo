import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@follow/components/ui/accordion/index.js"
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

    return (
      <div
        className={`bg-material-medium size-full min-w-0 max-w-prose rounded-lg border text-left ${
          hasError ? "border-red/30" : "border-border"
        }`}
      >
        <div className="w-[9999px] max-w-[calc(var(--ai-chat-layout-width,65ch)_-120px)]" />
        <Accordion type="single" collapsible>
          <AccordionItem value="tool-invocation">
            <AccordionTrigger className="flex w-full cursor-pointer items-center gap-3 py-1 pl-4 pr-2 hover:no-underline">
              {/* Tool Info */}
              <div className="flex h-6 min-w-0 flex-1 items-center">
                <div className="flex items-center gap-2 text-xs">
                  <i
                    className={hasError ? "i-mgc-close-cute-re text-red" : "i-mingcute-tool-line"}
                  />
                  <span className="text-text-secondary">
                    {hasError ? "Tool Failed:" : "Tool Calling:"}
                  </span>
                  <h4 className={`truncate font-medium ${hasError ? "text-red" : "text-text"}`}>
                    {toolName}
                  </h4>
                </div>
              </div>
            </AccordionTrigger>

            <AccordionContent className="min-w-0 border-t border-zinc-200/50 bg-zinc-50/50 p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50">
              <div className="space-y-3">
                {"input" in part && (
                  <div>
                    <div className="text-text-tertiary mb-2 text-xs font-semibold uppercase tracking-wide">
                      Arguments
                    </div>
                    <JsonHighlighter json={JSON.stringify(part.input, null, 2)} />
                  </div>
                )}

                {"output" in part && !!part.output && (
                  <div>
                    <div className="text-text-tertiary mb-2 text-xs font-semibold uppercase tracking-wide">
                      Result
                    </div>
                    <JsonHighlighter json={JSON.stringify(part.output, null, 2)} />
                  </div>
                )}

                {hasError && (
                  <div>
                    <div className="text-red mb-2 text-xs font-semibold uppercase tracking-wide">
                      Error
                    </div>
                    <div className="bg-red/5 border-red/20 text-red rounded-lg border p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <i className="i-mgc-warning-cute-re mt-0.5 flex-shrink-0 text-base" />
                        <div className="min-w-0">
                          <div className="font-medium">Tool Execution Failed</div>
                          <div className="text-red/80 mt-1 break-words font-mono text-xs">
                            {"errorText" in part ? part.errorText : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
)
