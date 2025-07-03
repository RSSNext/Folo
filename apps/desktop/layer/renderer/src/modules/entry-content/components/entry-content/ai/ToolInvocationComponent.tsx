import type { ToolInvocation } from "@ai-sdk/ui-utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@follow/components/ui/accordion/index.js"
import * as React from "react"

interface ToolInvocationComponentProps {
  toolInvocation: ToolInvocation
}

export const ToolInvocationComponent: React.FC<ToolInvocationComponentProps> = ({
  toolInvocation,
}) => {
  const { toolName, state } = toolInvocation

  return (
    <div className="bg-material-medium border-border size-full overflow-hidden rounded-lg border text-left">
      <Accordion type="single" collapsible>
        <AccordionItem value="tool-invocation">
          <AccordionTrigger className="flex w-full cursor-pointer items-center gap-3 py-1 pl-4 pr-2 hover:no-underline">
            {/* Tool Info */}
            <div className="flex h-6 min-w-0 flex-1 items-center">
              <div className="flex items-center gap-2 text-xs">
                <i className="i-mingcute-tool-line" />
                <span className="text-text-secondary">Tool Calling:</span>
                <h4 className="text-text truncate font-medium">{toolName}</h4>
              </div>
              {state === "partial-call" && (
                <p className="text-text-tertiary mt-1 text-xs">Executing tool...</p>
              )}
            </div>
          </AccordionTrigger>

          {(state === "call" || state === "result") && (
            <AccordionContent className="border-t border-zinc-200/50 bg-zinc-50/50 p-4 dark:border-zinc-700/50 dark:bg-zinc-800/50">
              <div className="space-y-3">
                {(state === "call" || state === "result") && "args" in toolInvocation && (
                  <div>
                    <div className="text-text-tertiary mb-2 text-xs font-semibold uppercase tracking-wide">
                      Arguments
                    </div>
                    <pre className="text-text-secondary max-h-32 overflow-auto rounded-lg bg-zinc-100/80 p-3 text-xs leading-relaxed dark:bg-zinc-900/80">
                      {JSON.stringify(toolInvocation.args, null, 2)}
                    </pre>
                  </div>
                )}

                {state === "result" && "result" in toolInvocation && (
                  <div>
                    <div className="text-text-tertiary mb-2 text-xs font-semibold uppercase tracking-wide">
                      Result
                    </div>
                    <pre className="text-text max-h-32 overflow-auto rounded-lg bg-zinc-100/80 p-3 text-xs leading-relaxed dark:bg-zinc-900/80">
                      {JSON.stringify(toolInvocation.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    </div>
  )
}
