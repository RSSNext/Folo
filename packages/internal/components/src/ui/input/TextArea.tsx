import { useInputComposition } from "@follow/hooks"
import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import clsx from "clsx"
import { useMotionValue } from "motion/react"
import type { DetailedHTMLProps, PropsWithChildren, TextareaHTMLAttributes } from "react"
import { useCallback, useState } from "react"

const roundedMap = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  default: "rounded",
}
export const TextArea = ({
  ref,
  ...props
}: DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> &
  PropsWithChildren<{
    wrapperClassName?: string
    onCmdEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
    rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "default"
    bordered?: boolean
    autoHeight?: boolean
  }> & { ref?: React.Ref<HTMLTextAreaElement | null> }) => {
  const {
    className,
    wrapperClassName,
    children,
    rounded = "xl",
    bordered = true,
    onCmdEnter,
    autoHeight,
    ...rest
  } = props
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const handleMouseMove = useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - bounds.left)
      mouseY.set(clientY - bounds.top)
    },
    [mouseX, mouseY],
  )

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
    <div
      className={cn(
        "ring-accent/20 group relative flex h-full border ring-0 duration-200",
        roundedMap[rounded],

        "hover:border-accent/60 border-transparent",
        isFocus && "!border-accent/80 ring-2",

        "placeholder:text-text-tertiary dark:text-zinc-200",
        "bg-theme-background dark:bg-zinc-700/[0.15]",
        wrapperClassName,
      )}
      onMouseMove={handleMouseMove}
    >
      {bordered && (
        <div
          className={clsx(
            "border-border pointer-events-none absolute inset-0 z-0 border",
            roundedMap[rounded],
          )}
          aria-hidden="true"
        />
      )}
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
    </div>
  )
}
TextArea.displayName = "TextArea"
