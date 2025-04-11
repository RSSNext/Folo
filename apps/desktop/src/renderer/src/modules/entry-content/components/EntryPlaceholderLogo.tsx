import { Logo } from "@follow/components/icons/logo.jsx"
import { stopPropagation } from "@follow/utils/dom"

import { useFeedHeaderTitle } from "~/store/feed"

export const EntryPlaceholderLogo = () => {
  const title = useFeedHeaderTitle()

  return (
    <div
      data-hide-in-print
      onContextMenu={stopPropagation}
      className={
        "flex w-full min-w-0 flex-col items-center justify-center gap-1 px-12 pb-6 text-center text-lg font-medium text-zinc-400 duration-500"
      }
    >
      <Logo className="size-16 opacity-40 grayscale" />
      <div className="line-clamp-3 w-[60ch] max-w-full">{title}</div>
    </div>
  )
}
