import { cn } from "@follow/utils/utils"
import { cva } from "class-variance-authority"

// Design
// @see https://x.com/uiuxadrian/status/1822947443186504176

export const styledButtonVariant = cva(
  [
    "inline-flex cursor-button select-none items-center justify-center outline-offset-2 transition active:transition-none disabled:cursor-not-allowed",
    "ring-accent/20 duration-200 disabled:ring-0",
    "align-middle",
  ],
  {
    compoundVariants: [
      {
        variant: "primary",
        status: "disabled",
        className: "text-zinc-50 bg-theme-disabled",
      },
      {
        variant: "outline",
        status: "disabled",
        className:
          "text-theme-disabled border-theme-inactive dark:border-zinc-800 hover:!bg-theme-background",
      },
      {
        variant: "text",
        status: "disabled",
        className: "opacity-60",
      },
      {
        variant: "ghost",
        status: "disabled",
        className: "opacity-50 hover:!bg-transparent",
      },
    ],
    variants: {
      size: {
        sm: "px-2 py-1 rounded-md text-xs",
        default: "px-3 py-1.5 rounded-lg text-sm",
        lg: "px-4 py-2 rounded-lg text-base",
      },

      status: {
        disabled: "cursor-not-allowed !ring-0",
      },
      variant: {
        primary: cn(
          "bg-accent",
          "hover:contrast-[1.10] active:contrast-125",
          "font-semibold",
          "disabled:bg-theme-disabled disabled:dark:text-zinc-50",
          "text-zinc-100",
          "focus:border-accent/80 focus:outline-none focus:ring-2",
        ),

        outline: cn(
          "bg-theme-background font-semibold transition-colors duration-200",
          "border border-border hover:bg-zinc-50 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/80",
          "focus:border-accent/80",
        ),
        text: cn(
          "font-semibold text-accent",
          "hover:contrast-[1.10] active:contrast-125",
          tw`focus:text-accent focus:outline-none p-0 inline align-baseline`,
        ),
        ghost: cn("px-1.5 font-semibold", "hover:bg-material-ultra-thick"),
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)
