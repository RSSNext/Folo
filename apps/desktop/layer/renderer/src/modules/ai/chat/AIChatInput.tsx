import { TextArea } from "@follow/components/ui/input/TextArea.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { useEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils"
import { useRef, useState } from "react"

import { AIIcon } from "../icon"
import { AIChatShortcuts } from "./AIShortcuts"

export const AIChatInput = ({
  entryId,
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
  const entryTitle = useEntry(entryId, (state) => state.title)

  const [isShrink, setIsShrink] = useState(autoShrink)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
          <AIIcon />
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
              <div className="flex flex-1 flex-row items-center gap-3 text-sm">
                <Select defaultValue={entryTitle ? "entry" : "unread"}>
                  <SelectTrigger className="h-7 w-auto max-w-60 rounded-3xl py-0 [&>span]:truncate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="mt-2 max-w-60 rounded-xl">
                    {!!entryTitle && (
                      <SelectItem
                        className="w-auto rounded-lg pr-6 [&>span]:max-w-full [&>span]:truncate"
                        value="entry"
                      >
                        Current entry: {entryTitle}
                      </SelectItem>
                    )}
                    <SelectItem className="rounded-lg" value="unread">
                      My unread items
                    </SelectItem>
                    <SelectItem className="rounded-lg" value="subscriptions">
                      My subscriptions
                    </SelectItem>
                    <SelectItem className="rounded-lg" value="folo">
                      Everything on Folo
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-text-secondary shrink-0 font-normal">
                  @ Mention a date or source
                </span>
              </div>
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
