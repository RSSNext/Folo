import clsx from "clsx"
import { useId, useRef } from "react"

const size = {
  1: "text-[1.6em]",
  2: "text-[1.5em]",
  3: "text-[1.3em]",
  4: "text-[1.1em]",
  5: "text-[1.05em]",
  6: "text-[1em]",
}
export const createHeadingRenderer =
  (level: number) =>
  (
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
  ) => {
    const rid = useId()

    const As = `h${level}` as any
    const { node, ...rest } = props as any

    const ref = useRef<HTMLHeadingElement>(null)

    return (
      <As
        ref={ref}
        {...rest}
        data-rid={rid}
        className={clsx(rest.className, "group relative", size[level as keyof typeof size])}
      >
        {rest.children}
      </As>
    )
  }
