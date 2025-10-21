import { getView } from "@follow/constants"
import dayjs from "dayjs"
import { memo, useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { FeedIcon } from "~/modules/feed/feed-icon"

import type { AIDisplaySubscriptionsTool } from "../../store/types"
import { withDisplayStateHandler } from "./share"

type SingleSubscription = NonNullable<AIDisplaySubscriptionsTool["output"]>[number]

const AIDisplaySubscriptionsPartBase = ({
  output,
}: {
  output: NonNullable<AIDisplaySubscriptionsTool["output"]>
  input: NonNullable<AIDisplaySubscriptionsTool["input"]>
}) => {
  const navigateEntry = useNavigateEntry()

  const handleClick = useCallback(
    (sub: SingleSubscription) => (e: React.MouseEvent) => {
      e.preventDefault()
      navigateEntry({ feedId: sub.feedId, view: sub.view })
    },
    [navigateEntry],
  )

  return output.map((sub) => <Item key={sub.feedId} sub={sub} handleClick={handleClick} />)
}

const Item = memo(
  ({
    sub,
    handleClick,
  }: {
    sub: SingleSubscription
    handleClick: (sub: SingleSubscription) => (e: React.MouseEvent) => void
  }) => {
    const { feedId, title, image, siteUrl, category, subscribedAt, view } = sub
    const { t } = useTranslation()
    const currentView = getView(view)
    if (currentView === undefined) {
      return null
    }
    return (
      <button
        type="button"
        key={feedId}
        onClick={handleClick(sub)}
        className="group relative flex w-full flex-col items-start justify-start overflow-hidden rounded-lg border border-border bg-material-thick/80 p-4 text-left backdrop-blur-sm transition-colors hover:bg-theme-item-hover"
      >
        <div className="flex w-full items-start justify-between">
          <div className="flex">
            <FeedIcon
              disableFadeIn
              target={{
                type: "feed",
                title,
                image,
                siteUrl,
              }}
              siteUrl={siteUrl!}
            />
            <div className="flex min-w-0 flex-col">
              <h3 className="line-clamp-2 font-semibold leading-tight text-text">
                {title || "Untitled Feed"}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-text-tertiary">
                {category ? <span className="text-text-secondary">{category}</span> : null}
                <span>Subscribed {dayjs(subscribedAt).format("MMM DD, YYYY")}</span>
                {currentView.icon}
                <span>{t(currentView.name, { ns: "common" })}</span>
              </div>
            </div>
          </div>
          <i className="i-mgc-external-link-cute-re shrink-0 text-text-tertiary opacity-60 transition-opacity group-hover:opacity-100" />
        </div>
      </button>
    )
  },
)
export const AIDisplaySubscriptionsPart = withDisplayStateHandler<
  AIDisplaySubscriptionsTool["output"]
>({
  title: "Subscriptions",
  loadingDescription: "Fetching subscription data...",
  errorTitle: "Subscriptions Error",
})(AIDisplaySubscriptionsPartBase)
