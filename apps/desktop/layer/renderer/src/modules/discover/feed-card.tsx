import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import { RelativeTime } from "@follow/components/ui/datetime/index.js"
import { getBackgroundGradient } from "@follow/utils/color"
import { cn } from "@follow/utils/utils"
import type { FC } from "react"
import { memo } from "react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router"

import { setPreviewBackPath } from "~/atoms/preview"
import { Media } from "~/components/ui/media"
import { useFollow } from "~/hooks/biz/useFollow"
import { navigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useFeedSafeUrl } from "~/hooks/common/useFeedSafeUrl"
import type { apiClient } from "~/lib/api-fetch"
import { useSubscriptionByFeedId } from "~/store/subscription"

import { FollowSummary } from "../feed/feed-summary"

const numberFormatter = new Intl.NumberFormat("en-US", {})

type DiscoverItem = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"][number]

export const FeedCard: FC<{
  item: DiscoverItem
  onSuccess?: (item: DiscoverItem) => void
  onUnSubscribed?: (item: DiscoverItem) => void
  children?: React.ReactNode
  followButtonVariant?: "ghost" | "outline"
  followedButtonVariant?: "ghost" | "outline"
  followButtonClassName?: string
  followedButtonClassName?: string
  className?: string
  simple?: boolean
  hideButtons?: boolean
}> = memo(
  ({
    item,
    onSuccess,
    children,
    followButtonVariant,
    followedButtonVariant = "ghost",
    followButtonClassName,
    followedButtonClassName,
    className,
    simple,
    hideButtons,
  }) => {
    const follow = useFollow()
    const { t } = useTranslation()

    const subscription = useSubscriptionByFeedId(item.feed?.id || item.list?.id || "")
    const isSubscribed = !!subscription
    const location = useLocation()

    return (
      <Card
        data-feed-id={item.feed?.id || item.list?.id}
        className={cn(
          "select-text overflow-hidden rounded-b-none border-0 border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300 dark:border-zinc-800/50 dark:bg-neutral-800/50",
          className,
        )}
      >
        {children}
        <CardHeader className="p-0 pb-2">
          <FollowSummary feed={item.feed || item.list!} docs={item.docs} simple={simple} />
        </CardHeader>
        {item.docs ? (
          <CardContent className="p-0">
            <a href={item.docs} target="_blank" rel="noreferrer">
              <Button className="rounded-full bg-zinc-900 px-6 text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900">
                View Docs
              </Button>
            </a>
          </CardContent>
        ) : (
          <>
            <CardContent className="p-0">
              <div className="flex justify-between gap-4">
                <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {!!item.analytics?.subscriptionCount && (
                    <div className="flex items-center gap-1.5">
                      <i className="i-mgc-user-3-cute-re" />

                      <span>
                        {numberFormatter.format(item.analytics.subscriptionCount)}{" "}
                        {t("feed.follower", { count: item.analytics.subscriptionCount })}
                      </span>
                    </div>
                  )}
                  {!simple &&
                    (item.analytics?.updatesPerWeek ? (
                      <div className="flex items-center gap-1.5">
                        <i className="i-mgc-safety-certificate-cute-re" />
                        <span>
                          {t("feed.entry_week", { count: item.analytics.updatesPerWeek ?? 0 })}
                        </span>
                      </div>
                    ) : item.analytics?.latestEntryPublishedAt ? (
                      <div className="flex items-center gap-1.5">
                        <i className="i-mgc-safe-alert-cute-re" />
                        <span>{t("feed.updated_at")}</span>
                        <RelativeTime
                          date={item.analytics.latestEntryPublishedAt}
                          displayAbsoluteTimeAfterDay={Infinity}
                        />
                      </div>
                    ) : null)}
                </div>

                {!hideButtons && (
                  <div className="flex items-center justify-between gap-2">
                    {!isSubscribed && (
                      <Button
                        variant="ghost"
                        disabled={!item.feed?.id}
                        buttonClassName="rounded-lg px-3 font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                        onClick={() => {
                          if (!item.feed?.id) return
                          setPreviewBackPath(location.pathname)
                          navigateEntry({
                            feedId: item.feed.id,
                            view: item.analytics?.view ?? 0,
                          })
                        }}
                      >
                        {t("discover.preview")}
                      </Button>
                    )}
                    <Button
                      variant={isSubscribed ? followedButtonVariant : followButtonVariant}
                      onClick={() => {
                        follow({
                          isList: !!item.list?.id,
                          id: item.list?.id || item.feed?.id,
                          url: item.feed?.url,
                          onSuccess() {
                            onSuccess?.(item)
                          },
                        })
                      }}
                      buttonClassName={cn(
                        "relative overflow-hidden rounded-lg font-medium transition-all duration-300",
                        isSubscribed
                          ? "border-zinc-200/80 text-zinc-400 dark:border-zinc-700/80"
                          : "",
                        isSubscribed ? followedButtonClassName : followButtonClassName,
                      )}
                    >
                      {isSubscribed ? t("feed.actions.followed") : t("feed.actions.follow")}
                    </Button>
                  </div>
                )}
              </div>
              {!!item.entries?.length && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {item.entries
                      .filter((e) => !!e)
                      .map((entry) => (
                        <SearchResultContent key={entry.id} entry={entry} />
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
    )
  },
)

const SearchResultContent: FC<{
  entry: NonUndefined<DiscoverItem["entries"]>[number]
}> = memo(({ entry }) => {
  const safeUrl = useFeedSafeUrl(entry.id)
  return (
    <a
      key={entry.id}
      href={safeUrl ?? "#"}
      target="_blank"
      className="group relative flex flex-col overflow-hidden rounded-lg bg-zinc-50/50 shadow-zinc-100 transition-all duration-200 hover:-translate-y-px hover:shadow-md dark:bg-zinc-800/50 dark:shadow-neutral-700/50"
      rel="noreferrer"
    >
      <div className="aspect-[3/2] w-full overflow-hidden">
        <FeedCardMediaThumbnail entry={entry} />
      </div>
      <div className="flex flex-1 flex-col justify-between p-3">
        {entry.title ? (
          <div className="line-clamp-2 text-xs font-medium leading-4 text-zinc-900 group-hover:text-black dark:text-zinc-200 dark:group-hover:text-white">
            {entry.title}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <i className="i-mgc-link-cute-re shrink-0 translate-y-px self-start text-[14px]" />
            <span className="line-clamp-2 break-all">{entry.url || "Untitled"}</span>
          </div>
        )}
        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <RelativeTime date={entry.publishedAt} displayAbsoluteTimeAfterDay={Infinity} />
        </div>
      </div>
    </a>
  )
})

const FeedCardMediaThumbnail: FC<{
  entry: NonUndefined<DiscoverItem["entries"]>[number]
}> = ({ entry }) => {
  const [, , , bgAccent, bgAccentLight] = getBackgroundGradient(
    entry.title || entry.url || "Untitled",
  )

  if (entry.media?.[0]) {
    return (
      <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
        <Media
          src={entry.media[0].url}
          type={entry.media[0].type}
          previewImageUrl={entry.media[0].preview_image_url}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
    )
  }

  return (
    <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.01]"
        style={{
          background: `linear-gradient(145deg, ${bgAccent}, ${bgAccentLight})`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {entry.title ? (
          <div className="text-base font-medium text-white/90">
            {entry.title.slice(0, 1).toUpperCase()}
          </div>
        ) : (
          <i className="i-mingcute-news-line text-xl text-white/80" />
        )}
      </div>
      <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
    </div>
  )
}
