import { Logo } from "@follow/components/icons/logo.jsx"
import { stopPropagation } from "@follow/utils/dom"

import { useFeedHeaderTitle } from "~/store/feed/hooks"

export const EntryPlaceholderLogo = () => {
  const title = useFeedHeaderTitle()

  return (
    <div
      data-hide-in-print
      onContextMenu={stopPropagation}
      className={
        "text-text-secondary flex w-full min-w-0 flex-col items-center justify-center gap-1 px-12 pb-6 text-center text-lg font-medium duration-500"
      }
    >
      <Logo className="size-16 opacity-40 grayscale" />
      <div className="line-clamp-3 w-[60ch] max-w-full opacity-70">{title}</div>
    </div>
  )
}
