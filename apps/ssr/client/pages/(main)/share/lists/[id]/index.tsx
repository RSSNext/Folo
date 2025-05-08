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
      deeplink: `list?id=${id}&view=${list.data.list.view}`,
      fallbackUrl: `/timeline/view-${list.data.list.view}/list-${id}/pending`,
    })
  }

  return (
    <MainContainer className="items-center">
      {list.isLoading ? (
        <LoadingCircle size="large" className="center fixed inset-0" />
      ) : (
        list.data?.list && (
          <div className="w-full max-w-full">
            <div className="mx-auto my-4 flex max-w-prose flex-col items-center space-y-5 px-2">
              <FeedIcon
                fallback
                feed={list.data.list}
                className="mask-squircle mask shrink-0"
                size={64}
                noMargin
              />
              <div className="flex flex-col items-center">
                <div className="mb-2 flex items-center text-2xl font-bold">
                  <h1>{list.data.list.title}</h1>
                </div>
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
              {list.data.list.description && (
                <div className="line-clamp-2 text-balance text-center text-zinc-600">
                  {list.data.list.description}
                </div>
              )}
              <div className="flex justify-between gap-4">
                <div className="flex items-center gap-4 text-base text-zinc-500 dark:text-zinc-400">
                  {!!list.data?.subscriptionCount && (
                    <div className="flex items-center gap-1">
                      <i className="i-mgc-user-3-cute-re" />

                      <span>
                        {numberFormatter.format(list.data?.subscriptionCount)}{" "}
                        {t("feed.follower", { count: list.data?.subscriptionCount })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="center flex gap-4">
                <Button
                  variant={isSubscribed ? "outline" : undefined}
                  onClick={() => {
                    handleOpenInFollowApp()
                  }}
                  size="lg"
                >
                  <FollowIcon className="mr-2 size-3" />
                  {isSubscribed
                    ? t("feed.actions.followed")
                    : t("feed.actions.open", { which: APP_NAME })}
                </Button>
              </div>
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
            </div>
            {!!list.data.entries?.length && (
              <>
                <div className="mt-8 text-zinc-500">{t("feed.preview")}</div>
                <div className={cn("w-full pb-12 pt-8", "flex flex-col gap-2")}>
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
      className="relative flex cursor-pointer items-center justify-between text-base"
      href={`/share/feeds/${feed.id}`}
      target="_blank"
      key={feed.id}
    >
      <div className="flex shrink-0 items-center">
        <FeedIcon fallback feed={feed} className="mask-squircle mask mr-2 shrink-0" size={20} />
        <div className="shrink-0">{feed.title}</div>
        <FeedCertification feed={feed} />
      </div>
      <div className="ml-4 truncate break-all text-sm text-zinc-500">{feed.description}</div>
    </a>
  )
}
