import { useInputComposition } from "@follow/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import type { DetailedHTMLProps, PropsWithChildren, TextareaHTMLAttributes } from "react"
import { useCallback, useState } from "react"
import * as React from "react"

import type { RoundedSize } from "./TextAreaWrapper"
import { roundedMap, TextAreaWrapper } from "./TextAreaWrapper"

export const TextArea = ({
  ref,
  ...props
}: DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> &
  PropsWithChildren<{
    wrapperClassName?: string
    onCmdEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    rounded?: RoundedSize
    bordered?: boolean
    autoHeight?: boolean
  }> & { ref?: React.Ref<HTMLTextAreaElement | null> }) => {
  const {
    className,
    wrapperClassName,
    children,
    rounded = "lg",
    bordered = true,
    onCmdEnter,
    autoHeight,
    ...rest
  } = props

  const syncHeight = useCallback(() => {
    if (ref && "current" in ref && ref.current) {
      const el = ref.current
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
  }, [ref])

  const inputProps = useInputComposition<HTMLTextAreaElement>(props)
  const [isFocus, setIsFocus] = useState(false)

  return (
    <TextAreaWrapper
      wrapperClassName={wrapperClassName}
      rounded={rounded}
      bordered={bordered}
      isFocused={isFocus}
    >
      <textarea
        ref={ref}
        className={cn(
          "size-full resize-none bg-transparent",
          "overflow-auto px-3 py-4",
          "!outline-none",
          "text-text placeholder:text-text-tertiary",
          "focus:!bg-accent/5",
          roundedMap[rounded],
          className,
        )}
        {...rest}
        onFocus={(e) => {
          setIsFocus(true)
          rest.onFocus?.(e)
        }}
        onBlur={(e) => {
          setIsFocus(false)
          rest.onBlur?.(e)
        }}
        onContextMenu={stopPropagation}
        {...inputProps}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            onCmdEnter?.(e)
          }
          rest.onKeyDown?.(e)
          inputProps.onKeyDown?.(e)
        }}
        onInput={(e) => {
          if (autoHeight) {
            syncHeight()
          }
          rest.onInput?.(e)
        }}
      />

      {children}
    </TextAreaWrapper>
  )
}
TextArea.displayName = "TextArea"
