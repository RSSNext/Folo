import { cn } from "@follow/utils"
import { memo } from "react"
import { useTranslation } from "react-i18next"

import { FEED_COLLECTION_LIST } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteFeedId } from "~/hooks/biz/useRouteParams"

import { feedColumnStyles } from "../styles"

export const StarredItem = memo(({ view }: { view: number }) => {
  const feedId = useRouteFeedId()
  const navigateEntry = useNavigateEntry()
  const { t } = useTranslation()

  return (
    <div
      data-sub={FEED_COLLECTION_LIST}
      data-active={feedId === FEED_COLLECTION_LIST}
      className={cn(
        "cursor-menu mt-1 flex h-8 w-full shrink-0 items-center gap-2 rounded-md px-2.5",
        feedColumnStyles.item,
      )}
      onClick={(e) => {
        e.stopPropagation()
        if (view !== undefined) {
          navigateEntry({
            entryId: null,
            feedId: FEED_COLLECTION_LIST,
            view,
          })
        }
      }}
    >
      <i className="i-mgc-star-cute-fi size-4 -translate-y-px text-amber-500" />
      {t("words.starred")}
    </div>
  )
})
StarredItem.displayName = "StarredItem"
