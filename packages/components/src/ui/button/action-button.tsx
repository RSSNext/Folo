import { useFocusable } from "@follow/components/common/Focusable.jsx"
import { stopPropagation } from "@follow/utils/dom"
import { cn, getOS } from "@follow/utils/utils"
import * as React from "react"
import { useState } from "react"
import type { Options } from "react-hotkeys-hook"
import { useHotkeys } from "react-hotkeys-hook"

import { KbdCombined } from "../kbd/Kbd"
import { Tooltip, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "../tooltip"

export interface ActionButtonProps {
  icon?: React.ReactNode | ((props: { isActive?: boolean; className: string }) => React.ReactNode)
  tooltip?: React.ReactNode
  tooltipSide?: "top" | "bottom"
  tooltipDefaultOpen?: boolean
  active?: boolean
  disabled?: boolean
  clickableDisabled?: boolean
  shortcut?: string
  disableTriggerShortcut?: boolean
  enableHoverableContent?: boolean
  size?: "sm" | "base" | "lg"
  id?: string

  /**
   * @description only trigger shortcut when focus with in `<Focusable />`
   * @default false
   */
  shortcutOnlyFocusWithIn?: boolean
}

const actionButtonStyleVariant = {
  size: {
    lg: tw`text-xl size-10`,
    base: tw`text-xl size-8`,
    sm: tw`text-sm size-6`,
  },
}

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ComponentType<ActionButtonProps> & React.HTMLAttributes<HTMLButtonElement>
>(
  (
    {
      icon,
      id,
      tooltip,
      className,
      tooltipSide,
      tooltipDefaultOpen,
      children,
      active,
      shortcut,
      disabled,
      clickableDisabled,
      disableTriggerShortcut,
      enableHoverableContent,
      size = "base",
      shortcutOnlyFocusWithIn,
      onClick,
      ...rest
    },
    ref,
  ) => {
    const finalShortcut =
      getOS() === "Windows" ? shortcut?.replace("meta", "ctrl").replace("Meta", "Ctrl") : shortcut
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    React.useImperativeHandle(ref, () => buttonRef.current!)

    const [loading, setLoading] = useState(false)

    const Trigger = (
      <button
        ref={buttonRef}
        // @see https://github.com/radix-ui/primitives/issues/2248#issuecomment-2147056904
        onFocusCapture={stopPropagation}
        className={cn(
          "no-drag-region pointer-events-auto inline-flex items-center justify-center",
          active && typeof icon !== "function" && "bg-zinc-500/15 hover:bg-zinc-500/20",
          "hover:bg-theme-button-hover data-[state=open]:bg-theme-button-hover rounded-md duration-200",
          "disabled:cursor-not-allowed disabled:opacity-50",
          clickableDisabled && "cursor-not-allowed opacity-50",
          actionButtonStyleVariant.size[size],
          className,
        )}
        type="button"
        disabled={disabled}
        onClick={
          typeof onClick === "function"
            ? async (e) => {
                if (loading) return
                setLoading(true)
                try {
                  await (onClick(e) as void | Promise<void>)
                } finally {
                  setLoading(false)
                }
              }
            : onClick
        }
        {...rest}
      >
        {loading ? (
          <i className="i-mgc-loading-3-cute-re animate-spin" />
        ) : typeof icon === "function" ? (
          React.createElement(icon, {
            className: "size-4 grayscale text-current",

            isActive: active,
          })
        ) : (
          icon
        )}

        {children}
      </button>
    )

    return (
      <>
        {finalShortcut && !disableTriggerShortcut && (
          <HotKeyTrigger
            shortcut={finalShortcut}
            fn={() => buttonRef.current?.click()}
            shortcutOnlyFocusWithIn={shortcutOnlyFocusWithIn}
          />
        )}
        {tooltip ? (
          <Tooltip disableHoverableContent={!enableHoverableContent}>
            <TooltipRoot defaultOpen={tooltipDefaultOpen} key={id}>
              <TooltipTrigger
                aria-label={typeof tooltip === "string" ? tooltip : undefined}
                asChild
              >
                {Trigger}
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent className="flex items-center gap-1" side={tooltipSide ?? "bottom"}>
                  {tooltip}
                  {!!finalShortcut && (
                    <div className="ml-1">
                      <KbdCombined className="text-foreground/80">{finalShortcut}</KbdCombined>
                    </div>
                  )}
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </Tooltip>
        ) : (
          Trigger
        )}
      </>
    )
  },
)

const HotKeyTrigger = ({
  shortcut,
  fn,
  options,
  shortcutOnlyFocusWithIn,
}: {
  shortcut: string
  fn: () => void
  options?: Options
  shortcutOnlyFocusWithIn?: boolean
}) => {
  const isFocusWithIn = useFocusable()
  const enabledInOptions = options?.enabled || true

  useHotkeys(shortcut, fn, {
    preventDefault: true,
    enabled: shortcutOnlyFocusWithIn
      ? isFocusWithIn
        ? enabledInOptions
        : false
      : enabledInOptions,
    ...options,
  })
  return null
}
