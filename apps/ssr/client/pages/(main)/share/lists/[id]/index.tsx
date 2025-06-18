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
import { cn, formatNumber } from "@follow/utils/utils"
import { Fragment, memo } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

const FeedRow = memo<{ feed: Feed["feed"] }>(({ feed }) => {
  return (
    <a
      className="border-border/40 bg-card hover:border-border group relative flex cursor-pointer items-start justify-between rounded-lg border p-4 transition-all duration-200 hover:shadow-sm hover:shadow-black/5 dark:hover:shadow-white/5"
      href={`/share/feeds/${feed.id}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex min-w-0 flex-1 items-start space-x-3">
        <div className="shrink-0">
          <FeedIcon fallback feed={feed} className="mask-squircle mask" size={40} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="group-hover:text-accent truncate font-medium text-zinc-900 transition-colors dark:text-zinc-100">
              {feed.title}
            </h3>
            <FeedCertification feed={feed} />
          </div>
          {feed.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {feed.description}
            </p>
          )}
        </div>
      </div>
      <div className="ml-3 shrink-0">
        <i className="i-mingcute-arrow-right-line text-zinc-400 transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  )
})

// Backend limit
const SIZE = 5
FeedRow.displayName = "FeedRow"

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

  if (list.isLoading) {
    return <LoadingCircle size="large" className="center fixed inset-0" />
  }

  if (!list.data?.list) {
    return null
  }

  return (
    <MainContainer className="bg-background min-h-screen">
      <Fragment>
        {/* Hero Section */}
        <div>
          <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 sm:py-20">
            {/* List Icon */}
            <div className="mb-6">
              <div className="relative mx-auto inline-block">
                <FeedIcon
                  fallback
                  feed={list.data.list}
                  className="mask-squircle mask border-border border"
                  size={80}
                  noMargin
                />
              </div>
            </div>

            {/* List Info */}
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl dark:text-zinc-100">
                {list.data.list.title}
              </h1>

              {/* Owner */}
              <div className="flex justify-center">
                <a
                  href={`/share/users/${list.data.list.owner?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  <span className="text-sm">{t("feed.madeby")}</span>
                  <Avatar className="border-border/60 size-6 border">
                    <AvatarImage src={list.data.list.owner?.image || undefined} />
                    <AvatarFallback className="text-xs">
                      {list.data.list.owner?.name?.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{list.data.list.owner?.name}</span>
                </a>
              </div>

              {list.data.list.description && (
                <p className="mx-auto max-w-2xl text-balance text-zinc-600 dark:text-zinc-400">
                  {list.data.list.description}
                </p>
              )}

              {/* Stats */}
              <div className="!mt-8 flex justify-center">
                <div className="divide-material-ultra-thick flex items-center divide-x">
                  <div className="px-4 text-center">
                    <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {list.data.feedCount || 0}
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      {(list.data.list.feedIds?.length || 0) > 1 ? "Feeds" : "Feed"}
                    </div>
                  </div>

                  {!!list.data?.subscriptionCount && (
                    <div className="px-4 text-center">
                      <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatNumber(list.data.subscriptionCount)}
                      </div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        {t("feed.follower", { count: list.data.subscriptionCount })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow Button */}
              <div className="!mt-8">
                <Button
                  variant={isSubscribed ? "outline" : "primary"}
                  size="lg"
                  onClick={handleOpenInFollowApp}
                >
                  <FollowIcon className="mr-2 size-4" />
                  {isSubscribed
                    ? t("feed.actions.followed")
                    : t("feed.actions.open", { which: APP_NAME })}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feeds Section */}
        <div className="mx-auto max-w-6xl px-6 pb-8 sm:px-8">
          <div className="border-border/40 mb-6 border-b pb-3">
            <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
              Feeds in this List
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {listData.feedIds
              ?.slice(0, SIZE)
              .map((feedId) => <FeedRow feed={feedMap[feedId]!} key={feedId} />)}
          </div>

          {"feedCount" in list.data && list.data.feedCount > SIZE && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleOpenInFollowApp}
                className="hover:text-accent text-sm text-zinc-500 transition-colors dark:text-zinc-400"
              >
                {t("feed.follow_to_view_all", {
                  count: list.data.feedCount || 0,
                })}
              </button>
            </div>
          )}
        </div>

        {/* Entries Preview */}
        {!!list.data.entries?.length && (
          <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-8">
            <div className="border-border/40 mb-6 border-b pb-3">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Recent Posts</h2>
            </div>

            <div className={cn("w-full", "flex flex-col gap-2")}>
              <Item entries={list.data.entries} view={list.data.list.view} />
            </div>
          </div>
        )}
      </Fragment>
    </MainContainer>
  )
}
