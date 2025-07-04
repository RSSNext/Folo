import { TextArea } from "@follow/components/ui/input/TextArea.js"
import { cn } from "@follow/utils"
import { use, useState } from "react"

import { AISpline } from "../icon"
import { AIPanelRefsContext } from "./__internal__/AIChatContext"
import { AIChatShortcuts } from "./AIShortcuts"

export const AIChatInput = ({
  autoShrink,
  hideIcon,
  onSubmit,
  input,
  setInput,
}: {
  entryId?: string
  autoShrink?: boolean
  hideIcon?: boolean
  onSubmit?: (value: string) => void
  input?: string
  setInput?: (value: string) => void
}) => {
  const [isShrink, setIsShrink] = useState(autoShrink)

  const { inputRef: textareaRef } = use(AIPanelRefsContext)
  const handleSubmit = (value: string) => {
    if (textareaRef.current) {
      onSubmit?.(value)
      textareaRef.current.value = ""
    }
  }

  return (
    <div className="relative flex w-full flex-row gap-2">
      {!hideIcon && (
        <div className="center h-14">
          <AISpline />
        </div>
      )}
      <div className="flex min-w-0 grow flex-col gap-2">
        <TextArea
          value={input}
          onChange={(e) => {
            setInput?.(e.target.value)
          }}
          rows={isShrink ? 1 : undefined}
          ref={textareaRef}
          autoHeight
          wrapperClassName={cn(
            "w-full bg-background/80 backdrop-blur-lg shadow-context-menu h-auto",
            !isShrink && "pb-12",
          )}
          placeholder="Describe a task or ask a question"
          rounded="3xl"
          className={cn("px-5 focus:!bg-transparent", !isShrink && "pb-0")}
          onFocus={() => {
            setIsShrink(false)
          }}
        >
          {!isShrink && (
            <div className="absolute inset-x-4 bottom-3 flex items-center justify-between leading-none">
              <div className="flex flex-1 flex-row items-center gap-3 text-sm" />
              <div className="flex flex-row items-center gap-3">
                <i className="i-mgc-mic-cute-re text-xl" />
                <i
                  className="i-mgc-arrow-up-circle-cute-fi text-3xl transition-transform hover:scale-110"
                  onClick={() => {
                    handleSubmit(textareaRef.current?.value ?? "")
                  }}
                />
              </div>
            </div>
          )}
        </TextArea>
        {!isShrink && <AIChatShortcuts className="pl-4" onSubmit={handleSubmit} />}
      </div>
    </div>
  )
}
