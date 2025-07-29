import { stopPropagation } from "@follow/utils/dom"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { SimpleDiscoverModal } from "../SimpleDiscoverModal"

export const EmptyFeedList = memo(({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => {
  const { t } = useTranslation()
  const location = useLocation()
  const isOnDiscoverPage = location.pathname === "/discover"
  const { present } = useModalStack()

  const handleClick = (e: React.MouseEvent) => {
    stopPropagation(e)
    onClick?.(e)

    if (!isOnDiscoverPage) {
      // Show simplified discover modal when already on discover page
      present({
        title: t("words.discover"),
        content: ({ dismiss }) => <SimpleDiscoverModal dismiss={dismiss} />,
        clickOutsideToDismiss: true,
      })
    }
  }

  return (
    <div className="mt-12 flex flex-1 items-center font-normal text-zinc-500">
      {isOnDiscoverPage ? (
        <div
          className="cursor-menu flex flex-1 flex-col items-center justify-center gap-2"
          onClick={handleClick}
        >
          <i className="i-mgc-arrow-right-up-cute-re text-3xl" />
          <span className="text-balance text-center text-sm">
            {t("sidebar.already_on_discover_page")}
          </span>
        </div>
      ) : (
        <div
          className="cursor-menu flex flex-1 flex-col items-center justify-center gap-2"
          onClick={handleClick}
        >
          <i className="i-mgc-add-cute-re text-3xl" />
          <span className="text-base">{t("sidebar.add_more_feeds")}</span>
        </div>
      )}
    </div>
  )
})
EmptyFeedList.displayName = "EmptyFeedList"
