import { cn } from "@follow/utils/utils"
import type { DetailedHTMLProps, FC, HTMLAttributes } from "react"

export const Divider: FC<DetailedHTMLProps<HTMLAttributes<HTMLHRElement>, HTMLHRElement>> = (
  props,
) => {
  const { className, ...rest } = props
  return (
    <hr
      className={cn(
        "my-4 h-[0.5px] border-0",
        "bg-[#282828] !opacity-[0.36] dark:bg-[#F6F6F6]",
        className,
      )}
      {...rest}
    />
  )
}

export const DividerVertical: FC<
  DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
> = (props) => {
  const { className, ...rest } = props
  return (
    <span
      className={cn(
        "mx-3 inline-block h-full w-[0.5px] select-none text-transparent",
        "bg-[#282828] opacity-[0.36] dark:bg-[#F6F6F6]",
        className,
      )}
      {...rest}
    >
      w
    </span>
  )
}
