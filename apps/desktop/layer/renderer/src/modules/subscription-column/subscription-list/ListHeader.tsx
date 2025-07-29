import type { FeedViewType } from "@follow/constants"
import { views } from "@follow/constants"
import { useCategoryOpenStateByView } from "@follow/store/subscription/hooks"
import { subscriptionActions } from "@follow/store/subscription/store"
import { useUnreadByView } from "@follow/store/unread/hooks"
import { stopPropagation } from "@follow/utils"
import { useTranslation } from "react-i18next"

import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"

import { UnreadNumber } from "../UnreadNumber"
import { SortButton } from "./SortButton"

export const ListHeader = ({ view }: { view: FeedViewType }) => {
  const { t } = useTranslation()
  const categoryOpenStateData = useCategoryOpenStateByView(view)
  const expansion = Object.values(categoryOpenStateData).every((value) => value === true)

  const totalUnread = useUnreadByView(view)

  const navigateEntry = useNavigateEntry()

  return (
    <div onClick={stopPropagation} className="mx-3 flex items-center justify-between px-2.5 py-1">
      <div
        className="text-base font-bold"
        onClick={(e) => {
          e.stopPropagation()
          if (!document.hasFocus()) return
          if (view !== undefined) {
            navigateEntry({
              entryId: null,
              feedId: null,
              view,
            })
          }
        }}
      >
        {view !== undefined && t(views[view]!.name, { ns: "common" })}
      </div>
      <div className="text-text-secondary ml-2 flex items-center gap-3 text-base lg:text-sm">
        <SortButton />
        {expansion ? (
          <i
            className="i-mgc-list-collapse-cute-re"
            onClick={() => subscriptionActions.expandCategoryOpenStateByView(view, false)}
          />
        ) : (
          <i
            className="i-mgc-list-expansion-cute-re"
            onClick={() => subscriptionActions.expandCategoryOpenStateByView(view, true)}
          />
        )}
        <UnreadNumber unread={totalUnread} className="text-xs !text-inherit" />
      </div>
    </div>
  )
}
