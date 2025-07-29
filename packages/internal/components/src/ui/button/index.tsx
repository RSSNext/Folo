import { useMobile } from "@follow/components/hooks/useMobile.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { cn } from "@follow/utils/utils"
import type { VariantProps } from "class-variance-authority"
import type { HTMLMotionProps } from "motion/react"
import { m } from "motion/react"
import * as React from "react"

import { styledButtonVariant } from "./variants"

export interface BaseButtonProps {
  isLoading?: boolean
}

// BIZ buttons

const motionBaseMap = {
  pc: {
    whileFocus: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    whileHover: { translateY: -1 },
  },
  mobile: {
    whileFocus: { opacity: 0.8 },
    whileTap: { opacity: 0.6 },
  },
} as const
export const MotionButtonBase = ({
  ref,
  children,
  disabled,
  ...rest
}: HTMLMotionProps<"button"> & { ref?: React.Ref<HTMLButtonElement | null> }) => {
  const isMobile = useMobile()
  return (
    <m.button
      layout="size"
      initial
      disabled={disabled}
      {...(disabled ? {} : motionBaseMap[isMobile ? "mobile" : "pc"])}
      {...rest}
      ref={ref}
    >
      {children}
    </m.button>
  )
}

MotionButtonBase.displayName = "MotionButtonBase"

export const Button = ({
  ref,
  buttonClassName,
  disabled,
  isLoading,
  variant,
  status,
  size,
  textClassName,
  ...props
}: React.PropsWithChildren<
  Omit<HTMLMotionProps<"button">, "children" | "className"> &
    BaseButtonProps &
    VariantProps<typeof styledButtonVariant> & {
      buttonClassName?: string
      textClassName?: string
    }
> & { ref?: React.Ref<HTMLButtonElement | null> }) => {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = React.useCallback(
    (e) => {
      if (isLoading || disabled) {
        e.preventDefault()
        return
      }

      props.onClick?.(e)
    },
    [disabled, isLoading, props],
  )
  return (
    <MotionButtonBase
      ref={ref}
      className={cn(
        styledButtonVariant({
          variant,
          status: isLoading || disabled ? "disabled" : undefined,
          size,
        }),
        buttonClassName,
      )}
      disabled={isLoading || disabled}
      {...props}
      onClick={handleClick}
    >
      <span className="contents">
        {typeof isLoading === "boolean" && (
          <m.span
            className="center overflow-hidden"
            animate={{
              width: isLoading ? "1.2em" : "0px",
              marginRight: isLoading ? "0.5rem" : "0",
              opacity: isLoading ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            {isLoading && <LoadingCircle size="small" className="center" />}
          </m.span>
        )}
        <span className={cn("center", textClassName)}>{props.children}</span>
      </span>
    </MotionButtonBase>
  )
}

export const IconButton = ({
  ref,
  ...props
}: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> &
  React.PropsWithChildren<{
    icon: React.JSX.Element
  }> & { ref?: React.Ref<HTMLButtonElement | null> }) => {
  const { icon, ...rest } = props
  return (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={cn(
        styledButtonVariant({
          variant: "ghost",
        }),
        "bg-accent/10 hover:bg-accent/20 active:bg-accent/30 dark:bg-accent/20 dark:hover:bg-accent/30 dark:active:bg-accent/40 group relative gap-2 px-4 transition-all duration-300",
        rest.className,
      )}
    >
      <span className="center">
        {React.cloneElement(icon, {
          className: cn("invisible", icon.props.className),
        })}

        {React.cloneElement(icon, {
          className: cn(
            "group-hover:text-white dark:group-hover:text-inherit",
            "absolute left-4 top-1/2 -translate-y-1/2 duration-200 group-hover:left-1/2 group-hover:-translate-x-1/2",
            icon.props.className,
          ),
        })}
      </span>
      <span className="duration-200 group-hover:opacity-0">{props.children}</span>
    </button>
  )
}

export { ActionButton, type ActionButtonProps } from "./action-button"
