import { cn } from "@follow/utils"
import clsx from "clsx"
import type { PropsWithChildren } from "react"
import * as React from "react"
import { useCallback, useState } from "react"

export type RoundedSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "default"

export const roundedMap: Record<RoundedSize, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  default: "rounded",
}

export interface TextAreaWrapperProps extends PropsWithChildren {
  /**
   * Wrapper class name for the outer container
   */
  wrapperClassName?: string
  /**
   * Border radius style
   */
  rounded?: RoundedSize
  /**
   * Whether to show border
   */
  bordered?: boolean
  /**
   * Whether the textarea is focused
   */
  isFocused?: boolean
  /**
   * Callback when focus state changes
   */
  onFocusChange?: (isFocused: boolean) => void
  /**
   * Additional padding class name
   */
  paddingClassName?: string
  /**
   * Callback when pointer down event occurs
   */
  onPointerDown?: (e: React.PointerEvent) => void
}

/**
 * TextAreaWrapper - A reusable wrapper component for textarea-like inputs
 *
 * This component provides common UI/UX patterns:
 * - Focus state management with ring animation
 * - Border styles with hover effects
 * - Theme-aware background colors
 * - Mouse tracking for potential gradient effects
 * - Configurable border radius
 * - Optional border overlay
 *
 */
export const TextAreaWrapper = ({
  children,
  wrapperClassName,
  rounded = "lg",
  bordered = true,
  isFocused: externalIsFocused,
  onFocusChange,
  paddingClassName,
  onPointerDown,
}: TextAreaWrapperProps) => {
  const [internalIsFocused, setInternalIsFocused] = useState(false)
  const isFocused = externalIsFocused ?? internalIsFocused

  const handleFocus = useCallback(() => {
    if (externalIsFocused === undefined) {
      setInternalIsFocused(true)
    }
    onFocusChange?.(true)
  }, [externalIsFocused, onFocusChange])

  const handleBlur = useCallback(() => {
    if (externalIsFocused === undefined) {
      setInternalIsFocused(false)
    }
    onFocusChange?.(false)
  }, [externalIsFocused, onFocusChange])

  return (
    <div
      className={cn(
        "ring-accent/20 group relative flex h-full overflow-hidden border ring-0 duration-200",
        roundedMap[rounded],

        // Border states
        "hover:border-accent/60 border-transparent",
        isFocused && "!border-accent/80 ring-2",

        // Theme colors
        "placeholder:text-text-tertiary dark:text-zinc-200",
        "bg-theme-background dark:bg-zinc-700/[0.15]",

        paddingClassName,
        wrapperClassName,
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPointerDown={onPointerDown}
    >
      {/* Optional border overlay for better visual separation */}
      {bordered && (
        <div
          className={clsx(
            "border-border pointer-events-none absolute inset-0 z-0 border",
            roundedMap[rounded],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  )
}

TextAreaWrapper.displayName = "TextAreaWrapper"
