import { Item } from "@client/components/items"
import { MainContainer } from "@client/components/layout/main"
import { FeedCertification } from "@client/components/ui/feed-certification"
import { FeedIcon } from "@client/components/ui/feed-icon"
import { openInFollowApp } from "@client/lib/helper"
import type { Feed } from "@client/query/feed"
import { useList } from "@client/query/list"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTitle } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"
import { toast } from "sonner"

const numberFormatter = new Intl.NumberFormat()
export function Component() {
  const { id } = useParams()

  const list = useList({
    id: id!,
  })
  const listData = list.data?.list
  const isSubscribed = !!list.data?.subscription

  const { t } = useTranslation()

  const feedMap =
    list.data?.list.feeds?.reduce(
      (acc, feed) => {
        acc[feed.id] = feed
        return acc
      },
      {} as Record<string, Feed["feed"]>,
    ) || {}

  useTitle(list.data?.list.title)

  const handleOpenInFollowApp = () => {
    openInFollowApp({
      deeplink: `add?type=list&id=${id!}`,
      fallbackUrl: `/timeline/view-0/all/pending?follow=${id}&follow_type=list`,
    })
  }

  return (
    <MainContainer>
      {list.isLoading ? (
        <LoadingCircle size="large" className="center fixed inset-0" />
      ) : (
        list.data?.list && (
          <div className="mx-auto mt-12 flex w-full max-w-5xl flex-col items-center justify-center p-4 lg:p-0">
            <FeedIcon
              fallback
              feed={list.data.list}
              className="mask-squircle mask shrink-0"
              size={64}
            />
            <div className="mb-6 flex max-w-prose flex-col items-center">
              <div className="mb-2 mt-4 flex items-center text-2xl font-bold">
                <h1>{list.data.list.title}</h1>
              </div>
              <div className="mb-2 text-sm text-zinc-500">{list.data.list.description}</div>
              <a
                href={`/share/users/${list.data.list.owner?.id}`}
                target="_blank"
                className="flex items-center gap-1 text-sm text-zinc-500"
              >
                <span>{t("feed.madeby")}</span>
                <Avatar className="inline-flex aspect-square size-5 rounded-full">
                  <AvatarImage src={list.data.list.owner?.image || undefined} />
                  <AvatarFallback>{list.data.list.owner?.name?.slice(0, 2)}</AvatarFallback>
                </Avatar>
              </a>
            </div>
            <div className="mb-4 text-sm">
              {t("feed.followsAndFeeds", {
                subscriptionCount: numberFormatter.format(list.data?.subscriptionCount),
                subscriptionNoun: t("feed.follower", { count: list.data?.subscriptionCount }),
                feedsCount: numberFormatter.format(list.data?.feedCount || 0),
                feedsNoun: t("feed.feeds", { count: listData?.feedIds?.length }),
                appName: APP_NAME,
              })}
            </div>
            <span className="center mb-8 flex gap-4">
              <Button
                variant={"outline"}
                onClick={() => {
                  toast.success(t("copied_link"))
                  navigator.clipboard.writeText(id!)
                }}
              >
                Copy List ID
              </Button>
              <Button
                variant={isSubscribed ? "outline" : undefined}
                onClick={handleOpenInFollowApp}
              >
                <FollowIcon className="mr-2 size-3" />
                {isSubscribed ? "Followed" : <>{APP_NAME}</>}
              </Button>
            </span>
            <div className="flex w-full max-w-3xl flex-col gap-4 pb-12 pt-8">
              {listData!.feedIds
                ?.slice(0, 7)
                .map((feedId) => <FeedRow feed={feedMap[feedId]!} key={feedId} />)}
              {"feedCount" in list.data && (
                <div onClick={handleOpenInFollowApp} className="text-sm text-zinc-500">
                  {t("feed.follow_to_view_all", {
                    count: list.data.feedCount || 0,
                  })}
                </div>
              )}
            </div>
            {!!list.data.entries?.length && (
              <>
                <div className="mt-8 text-zinc-500">{t("feed.preview")}</div>
                <div className={cn("w-full pb-12 pt-8", "flex max-w-3xl flex-col gap-2")}>
                  <Item entries={list.data.entries} view={list.data.list.view} />
                </div>
              </>
            )}
          </div>
        )
      )}
    </MainContainer>
  )
}

const FeedRow = ({ feed }: { feed: Feed["feed"] }) => {
  return (
    <a
      className="relative flex cursor-pointer items-center text-base"
      href={`/share/feeds/${feed.id}`}
      target="_blank"
      key={feed.id}
    >
      <FeedIcon fallback feed={feed} className="mask-squircle mask mr-2 shrink-0" size={20} />
      <div className="shrink-0">{feed.title}</div>
      <FeedCertification feed={feed} />
      <div className="ml-8 truncate text-sm text-zinc-500">{feed.description}</div>
    </a>
  )
}
