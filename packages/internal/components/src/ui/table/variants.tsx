import { cva } from "class-variance-authority"

export const tableHeadVariants = cva("", {
  variants: {
    size: {
      default: "h-12 px-4",
      sm: "h-6 px-3 font-normal text-zinc-800 dark:text-zinc-500",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

export const tableCellVariants = cva("", {
  variants: {
    size: {
      default: "px-4 py-2",
      sm: "py-1 pr-2 [&:last-child]:pr-0",
    },
  },
  defaultVariants: {
    size: "default",
  },
})
