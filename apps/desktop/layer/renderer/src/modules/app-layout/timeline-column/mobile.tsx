import { useEffect, useState } from "react"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { ROUTE_FEED_PENDING } from "~/constants/app"
import { ENTRY_COLUMN_LIST_SCROLLER_ID, LOGO_MOBILE_ID } from "~/constants/dom"
import { navigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"
import { usePreventOverscrollBounce } from "~/hooks/common"
import { EntryColumn } from "~/modules/entry-column"

import { MobileFloatBar } from "../subscription-column/float-bar.mobile"

export const EntryColumnMobile = () => {
  const isStartupTimeline = useGeneralSettingKey("startupScreen") === "timeline"

  const [scrollContainer, setScrollContainer] = useState<null | HTMLDivElement>(null)
  const view = useRouteParamsSelector((s) => s.view)
  const folderName = useRouteParamsSelector((s) => s.folderName)
  const listId = useRouteParamsSelector((s) => s.listId)
  useEffect(() => {
    const timer = setTimeout(() => {
      setScrollContainer(
        document.querySelector(`#${ENTRY_COLUMN_LIST_SCROLLER_ID}`) as HTMLDivElement,
      )
    }, 1000)
    return () => clearTimeout(timer)
  }, [view, folderName, listId])
  usePreventOverscrollBounce()

  return (
    <div className="flex h-screen min-w-0 grow overflow-hidden">
      <EntryColumn />

      {isStartupTimeline && (
        <MobileFloatBar
          scrollContainer={scrollContainer}
          onLogoClick={() => {
            const logo = document.querySelector(`#${LOGO_MOBILE_ID}`) as HTMLElement
            if (logo) {
              logo.click()
              logo.blur()
            }
          }}
          onViewChange={(view) => {
            navigateEntry({
              entryId: null,
              feedId: ROUTE_FEED_PENDING,
              view,
            })
          }}
        />
      )}
    </div>
  )
}
