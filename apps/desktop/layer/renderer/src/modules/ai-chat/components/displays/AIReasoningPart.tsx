import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@follow/components/ui/accordion/index.js"
import { cn } from "@follow/utils"
import * as React from "react"

interface AIReasoningPartProps {
  text: string
  isStreaming?: boolean
  className?: string
}

export const AIReasoningPart: React.FC<AIReasoningPartProps> = React.memo(
  ({ text, isStreaming = false, className }) => {
    const accordionValue = `reasoning-${Math.random()}`
    const [isOpen, setIsOpen] = React.useState(false)

    // Auto-expand when streaming starts
    React.useEffect(() => {
      if (isStreaming) {
        setIsOpen(true)
      }
    }, [isStreaming])

    return (
      <div className={cn("border-border min-w-0 max-w-full text-left", className)}>
        <div className="w-[calc(var(--ai-chat-layout-width,65ch))]" />

        <Accordion
          type="single"
          className="w-full"
          value={isOpen ? accordionValue : undefined}
          onValueChange={(value) => setIsOpen(value === accordionValue)}
        >
          <AccordionItem value={accordionValue} className="group border-none">
            <AccordionTrigger
              className="group flex h-6 min-w-0 flex-1 items-center justify-between py-0 hover:no-underline"
              chevron={false}
            >
              <div className="flex items-center gap-2 text-xs">
                <i className="i-mingcute-bulb-2-line text-purple" />
                <span className="text-text-secondary">
                  {isStreaming ? "Reasoning..." : "Reasoning"}
                </span>
              </div>

              <div className="ml-auto flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <i className="i-mgc-right-cute-re size-3 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              </div>
            </AccordionTrigger>

            <AccordionContent className="pb-0 pt-2">
              <div className="text-xs">
                <pre className="text-text-secondary bg-material-medium overflow-x-auto whitespace-pre-wrap rounded p-3 text-[11px] leading-relaxed">
                  {text}
                </pre>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  },
)

AIReasoningPart.displayName = "AIReasoningPart"
