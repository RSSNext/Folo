import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import { clsx, cn } from "@follow/utils/utils"
import type { FC, MouseEvent } from "react"
import { memo, useCallback, useRef } from "react"

export interface ITocItem {
  depth: number
  title: string
  anchorId: string
  index: number

  $heading: HTMLHeadingElement
}

export interface TocItemProps {
  heading: ITocItem
  // active: boolean
  rootDepth: number
  onClick?: (i: number, $el: HTMLElement | null, anchorId: string) => void

  isScrollOut: boolean
  range: number
  variant?: "line" | "title-line"
}

export const TocItem: FC<TocItemProps> = memo((props) => {
  const { onClick, heading, isScrollOut, range, variant = "line", rootDepth } = props
  const { $heading, anchorId, depth, index, title } = heading

  const $ref = useRef<HTMLButtonElement>(null)

  const isTitleLine = variant === "title-line"
  return (
    <button
      type="button"
      ref={$ref}
      data-index={index}
      className={cn("cursor-pointer", isTitleLine && "relative flex w-full flex-col")}
      style={
        isTitleLine
          ? {
              paddingLeft: `${(depth - rootDepth) * 12}px`,
            }
          : {
              lineHeight: "24px",
            }
      }
      data-depth={depth}
      onClick={useCallback(
        (e: MouseEvent) => {
          e.preventDefault()

          onClick?.(index, $heading, anchorId)
        },
        [anchorId, onClick, index, $heading],
      )}
      title={title}
    >
      {isTitleLine && (
        <EllipsisHorizontalTextWithTooltip
          className={clsx(
            "w-full min-w-0 truncate text-left text-xs",
            range
              ? "text-zinc-900 dark:text-zinc-300"
              : "text-zinc-500 hover:text-zinc-500 dark:text-zinc-400 dark:hover:text-zinc-300",
          )}
        >
          {title}
        </EllipsisHorizontalTextWithTooltip>
      )}
      <span
        style={{
          width: widthMap[depth],
        }}
        data-active={!!range}
        className={cn(
          "relative inline-block rounded-full",
          "bg-zinc-100 duration-200",
          isScrollOut && "bg-zinc-400/80",

          "dark:bg-zinc-800/80",
          isScrollOut && "dark:bg-zinc-700",
          !!range && "!bg-zinc-400/50 dark:!bg-zinc-600",
          "overflow-hidden",

          isTitleLine
            ? `my-1 h-1 duration-200 ${range ? "mb-3" : "mb-0.5"} bg-transparent dark:bg-transparent`
            : "h-1.5 hover:!bg-zinc-400 dark:hover:!bg-zinc-600",
        )}
      >
        <span
          className="absolute inset-y-0 left-0 z-[1] ml-[-12px] rounded-full bg-zinc-600 duration-75 ease-linear dark:bg-zinc-400"
          style={{
            width: `calc(${range * 100}% + 12px)`,
          }}
        />
      </span>
    </button>
  )
})

const widthMap = {
  1: 72 - 6,
  2: 60 - 6,
  3: 48 - 6,
  4: 36 - 6,
  5: 24 - 6,
  6: 12 - 6,
}

TocItem.displayName = "TocItem"
