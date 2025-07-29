import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { springScrollToElement } from "@follow/utils/scroller"
import { cn } from "@follow/utils/utils"
import { use, useId, useRef } from "react"

import { MarkdownRenderContainerRefContext } from "../context"

export const createHeadingRenderer =
  (level: number) =>
  (
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>,
  ) => {
    const rid = useId()

    const As = `h${level}` as any
    const { node, ...rest } = props as any

    const scroller = useScrollViewElement()
    const renderContainer = use(MarkdownRenderContainerRefContext)
    const ref = useRef<HTMLHeadingElement>(null)

    return (
      <As ref={ref} {...rest} data-rid={rid} className={cn(rest.className, "group relative")}>
        {rest.children}
        <span
          className={cn(
            "text-accent cursor-pointer select-none opacity-0 transition-opacity duration-200 group-hover:opacity-100",
            "relative ml-2",
            "@2xl:absolute @2xl:left-[-1.5em] @2xl:top-0 @2xl:opacity-0",
          )}
          aria-hidden
          onClick={() => {
            if (!renderContainer) return

            springScrollToElement(
              renderContainer.querySelector(`[data-rid="${rid}"]`)!,
              -100,
              scroller!,
            )
          }}
        >
          <i className="i-mingcute-hashtag-line invisible" />
          <span className="center absolute inset-0">
            <i className="i-mingcute-hashtag-line" />
          </span>
        </span>
      </As>
    )
  }
