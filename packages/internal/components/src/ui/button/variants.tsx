import { cn } from "@follow/utils/utils"
import { cva } from "class-variance-authority"

// Design
// @see https://x.com/uiuxadrian/status/1822947443186504176

export const styledButtonVariant = cva(
  [
    "inline-flex cursor-button select-none items-center justify-center outline-offset-2 transition-colors active:transition-none disabled:cursor-not-allowed",
    "duration-200 disabled:ring-0",
    "align-middle",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2",
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
        sm: "px-3 py-1 rounded-md text-sm font-medium",
        default: "px-4 py-1.5 rounded-lg text-sm font-semibold",
        lg: "px-5 py-2 rounded-lg text-base font-semibold",
      },

      status: {
        disabled: "cursor-not-allowed !ring-0",
      },
      variant: {
        primary: cn(
          "bg-accent",
          "hover:contrast-[1.10] hover:shadow-md hover:shadow-accent/20 active:contrast-125 active:shadow-none",
          "disabled:bg-theme-disabled disabled:dark:text-zinc-50 disabled:shadow-none",
          "text-zinc-100",
          "focus-visible:ring-accent/30",
          "transition-all duration-200",
        ),

        outline: cn(
          "bg-theme-background transition-colors duration-200",
          "border border-border hover:border-accent/50 hover:bg-zinc-50/80 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/80",
          "focus-visible:ring-accent/30",
          "hover:shadow-sm",
        ),
        text: cn(
          "text-accent",
          "hover:contrast-[1.10] active:contrast-125 hover:bg-accent/10",
          "focus-visible:ring-accent/30",
          "p-0 inline align-baseline",
        ),
        ghost: cn(
          "px-2",
          "hover:bg-material-ultra-thick",
          "focus-visible:ring-accent/30",
          "transition-all duration-200",
        ),
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)
