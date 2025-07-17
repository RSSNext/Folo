import {
  useFocusable,
  useGlobalFocusableScopeSelector,
} from "@follow/components/common/Focusable/index.js"
import type { EnhanceSet } from "@follow/utils"
import { stopPropagation } from "@follow/utils/dom"
import { cn, getOS } from "@follow/utils/utils"
import * as React from "react"
import { useCallback, useState } from "react"
import type { Options } from "react-hotkeys-hook"
import { useHotkeys } from "react-hotkeys-hook"

import { KbdCombined } from "../kbd/Kbd"
import { Tooltip, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "../tooltip"

export interface ActionButtonProps {
  icon?: React.ReactNode | ((props: { isActive?: boolean; className: string }) => React.ReactNode)
  tooltip?: React.ReactNode
  tooltipDescription?: React.ReactNode
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
   * Use motion effects to prompt and guide users to pay attention or click this button
   */
  highlightMotion?: boolean
  /**
   * @description only trigger shortcut when focus with in `<Focusable />`
   * @default false
   */
  shortcutOnlyFocusWithIn?: boolean
  /**
   * @description only trigger shortcut when in the scope, if not provided, the shortcut will be triggered in any scope
   * @default undefined
   */
  shortcutScope?: string | ((scope: EnhanceSet<string>) => boolean)
}

const actionButtonStyleVariant = {
  size: {
    lg: tw`text-xl size-10`,
    base: tw`text-xl size-8`,
    sm: tw`text-lg size-7`,
  },
}

export const ActionButton = ({
  ref,
  icon,
  id,
  tooltip,
  tooltipDescription,
  className,
  tooltipSide,
  tooltipDefaultOpen,
  highlightMotion,
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
  shortcutScope,
  ...rest
}: ComponentType<ActionButtonProps> &
  React.HTMLAttributes<HTMLButtonElement> & {
    ref?: React.Ref<HTMLButtonElement | null>
  }) => {
  const finalShortcut =
    getOS() === "Windows" ? shortcut?.replace("meta", "ctrl").replace("Meta", "Ctrl") : shortcut
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  React.useImperativeHandle(ref, () => buttonRef.current!)

  const [shouldHighlightMotion, setShouldHighlightMotion] = useState(highlightMotion)
  React.useEffect(() => {
    setShouldHighlightMotion(highlightMotion)
  }, [highlightMotion])

  const inScope = useGlobalFocusableScopeSelector(
    useCallback(
      (scope) =>
        shortcutScope
          ? typeof shortcutScope === "function"
            ? shortcutScope(scope)
            : scope.has(shortcutScope)
          : true,
      [shortcutScope],
    ),
  )

  const [loading, setLoading] = useState(false)

  const Trigger = (
    <button
      ref={buttonRef}
      // @see https://github.com/radix-ui/primitives/issues/2248#issuecomment-2147056904
      onFocusCapture={stopPropagation}
      className={cn(
        "no-drag-region pointer-events-auto inline-flex items-center justify-center",
        active && typeof icon !== "function" && "bg-zinc-500/15 hover:bg-zinc-500/20",
        "hover:bg-theme-item-hover data-[state=open]:bg-theme-item-active rounded-md duration-200",
        "disabled:cursor-not-allowed disabled:opacity-50",
        clickableDisabled && "cursor-not-allowed opacity-50",
        shouldHighlightMotion &&
          "relative after:absolute after:inset-0 after:animate-[radialPulse_3s_ease-in-out_infinite] after:rounded-md after:bg-center after:bg-no-repeat after:content-['']",
        actionButtonStyleVariant.size[size],
        className,
      )}
      style={{
        ...rest.style,
        ...(shouldHighlightMotion
          ? ({
              "--tw-accent-opacity": "0.3",
              "--highlight-color": "hsl(var(--fo-a) / var(--tw-accent-opacity))",
            } as React.CSSProperties)
          : {}),
      }}
      type="button"
      disabled={disabled}
      onClick={
        onClick
          ? async (e) => {
              setShouldHighlightMotion(false)
              if (loading) return
              setLoading(true)
              try {
                await (onClick(e) as void | Promise<void>)
              } finally {
                setLoading(false)
              }
            }
          : void 0
      }
      id={id}
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
      {finalShortcut && !disableTriggerShortcut && inScope && (
        <HotKeyTrigger
          shortcut={finalShortcut}
          fn={() => buttonRef.current?.click()}
          shortcutOnlyFocusWithIn={shortcutOnlyFocusWithIn}
        />
      )}
      {tooltip ? (
        <Tooltip disableHoverableContent={!enableHoverableContent}>
          <TooltipRoot defaultOpen={tooltipDefaultOpen} key={id}>
            <TooltipTrigger aria-label={typeof tooltip === "string" ? tooltip : undefined} asChild>
              {Trigger}
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent
                className="max-w-[300px] flex-col gap-1"
                side={tooltipSide ?? "bottom"}
              >
                <div className="flex items-center gap-1">
                  {tooltip}
                  {!!finalShortcut && (
                    <div className="ml-1">
                      <KbdCombined className="text-text">{finalShortcut}</KbdCombined>
                    </div>
                  )}
                </div>
                {tooltipDescription ? (
                  <div className="text-text-secondary text-body">{tooltipDescription}</div>
                ) : null}
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </Tooltip>
      ) : (
        Trigger
      )}
    </>
  )
}

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

  useHotkeys(replaceShortcut(shortcut), fn, {
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

const os = getOS()

const replaceShortcut = (shortcut: string) => {
  return shortcut.replace("$mod", os === "macOS" ? "Meta" : "Ctrl")
}
