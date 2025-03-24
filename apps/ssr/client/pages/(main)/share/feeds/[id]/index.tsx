import { Item } from "@client/components/items"
import { MainContainer } from "@client/components/layout/main"
import { FeedCertification } from "@client/components/ui/feed-certification"
import { askOpenInFollowApp } from "@client/lib/helper"
import { useEntriesPreview } from "@client/query/entries"
import { useFeed } from "@client/query/feed"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { FeedIcon } from "@follow/components/ui/feed-icon/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTitle } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"
import { useParams, useSearchParams } from "react-router"
import { toast } from "sonner"

const numberFormatter = new Intl.NumberFormat()
export function Component() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const view = Number.parseInt(search.get("view") || "0")

  const { t } = useTranslation("external")

  const feed = useFeed({
    id: id!,
  })

  const feedData = feed.data?.feed
  const isSubscribed = !!feed.data?.subscription
  const entries = useEntriesPreview({
    id,
  })

  useTitle(feed.data?.feed.title)

  if (feed.isLoading || !feed.data?.feed || !feedData) {
    return <LoadingCircle size="large" className="center fixed inset-0" />
  }

  return (
    <MainContainer className="items-center">
      <FeedIcon fallback feed={feed.data.feed} className="mask-squircle mask shrink-0" size={64} />

      <div className="flex max-w-prose flex-col items-center">
        <div className="mb-2 mt-4 flex items-center text-2xl font-bold">
          <h1>{feed.data.feed.title}</h1>
          <FeedCertification feed={feed.data.feed} />
        </div>
        <div className="mb-8 text-sm text-zinc-500">{feed.data.feed.description}</div>
      </div>

      <div className="mb-4 text-sm">
        {t("feed.followsAndReads", {
          subscriptionCount: numberFormatter.format(feed.data.subscriptionCount),
          subscriptionNoun: t("feed.follower", { count: feed.data.subscriptionCount }),
          readCount: numberFormatter.format(feed.data.readCount),
          readNoun: t("feed.read", { count: feed.data.readCount }),
          appName: APP_NAME,
        })}
      </div>

      <span className="center mb-8 flex gap-4">
        {feedData.url.startsWith("https://") ? (
          <Button
            variant={"outline"}
            onClick={() => {
              window.open(feedData.siteUrl || feedData.url, "_blank")
            }}
          >
            {t("feed.view_feed_url")}
          </Button>
        ) : (
          <Button
            variant={"outline"}
            onClick={() => {
              toast.success(t("copied_link"))
              navigator.clipboard.writeText(feedData.url)
            }}
          >
            {t("feed.copy_feed_url")}
          </Button>
        )}
        <Button
          variant={isSubscribed ? "outline" : undefined}
          onClick={() => {
            askOpenInFollowApp(`add?id=${id}`, () => {
              return `/timeline/view-${view}/all/pending?follow=${id}&follow_type=feed`
            })
          }}
        >
          <FollowIcon className="mr-1 size-3" />
          {isSubscribed ? t("feed.actions.followed") : <>{APP_NAME}</>}
        </Button>
      </span>
      <div className={cn("w-full pb-12 pt-8", "flex max-w-3xl flex-col gap-2")}>
        {entries.isLoading && !entries.data ? (
          <LoadingCircle size="large" className="center mt-12" />
        ) : (
          <Item entries={entries.data} feed={feed.data} view={view} />
        )}
      </div>
    </MainContainer>
  )
}
