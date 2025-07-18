import { FeedIcon } from "@client/components/ui/feed-icon"
import { openInFollowApp } from "@client/lib/helper"
import { UrlBuilder } from "@client/lib/url-builder"
import { useListsByUserId } from "@client/query/list"
import type { SubscriptionResult, User } from "@client/query/users"
import { useUserQuery, useUserSubscriptionsQuery } from "@client/query/users"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTitle } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import { Fragment, memo, useState } from "react"
import { useParams } from "react-router"

interface FeedCardProps {
  subscription: SubscriptionResult[number]
  feedId: string
  view: number
}

const FeedCard = memo<FeedCardProps>(({ subscription, feedId, view }) => {
  if (!("feeds" in subscription)) {
    return null
  }
  return (
    <div className="border-border/40 hover:border-border group/card relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:shadow-sm hover:shadow-black/5 dark:hover:shadow-white/5">
      {/* Feed Content */}
      <a
        className="block"
        href={UrlBuilder.shareFeed(feedId)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="flex items-start space-x-4">
          <div className="shrink-0">
            <FeedIcon fallback feed={subscription.feeds} size={44} className="rounded-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="group-hover/card:text-accent truncate font-medium text-zinc-900 transition-colors dark:text-zinc-100">
              {subscription.feeds?.title}
            </h3>
            {subscription.feeds?.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {subscription.feeds.description}
              </p>
            )}
          </div>
        </div>
      </a>

      {/* Follow Button - positioned absolutely to avoid layout shift */}
      <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 transition-all duration-200 ease-out group-hover/card:translate-y-0 group-hover/card:opacity-100">
        <Button
          size="sm"
          variant="primary"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openInFollowApp({
              deeplink: `feed?id=${feedId}&view=${view}`,
              fallbackUrl: `/timeline/view-${view}/${feedId}/pending`,
            })
          }}
        >
          <FollowIcon className="mr-1.5 size-3" />
          Open in {APP_NAME}
        </Button>
      </div>
    </div>
  )
})

FeedCard.displayName = "FeedCard"

export const Component = () => {
  const params = useParams()

  const user = useUserQuery(params.id)

  useTitle(user.data?.name)

  return (
    <>
      {user.isLoading ? (
        <LoadingCircle size="large" className="center fixed inset-0" />
      ) : (
        <Fragment>
          <UserHero user={user.data!} />
          <Lists userId={user.data?.id} />
          {/* Subscriptions Section */}
          <Subscriptions userId={user.data?.id} />
        </Fragment>
      )}
    </>
  )
}

const UserHero = ({ user }: { user: User }) => {
  const subscriptions = useUserSubscriptionsQuery(user.id)

  const totalFeeds = Object.values(subscriptions.data || {}).reduce(
    (total, category) => total + category.length,
    0,
  )

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-center sm:px-8 sm:py-12">
      {/* Avatar */}
      <div className="mb-6">
        <Avatar className="border-border mx-auto size-20 border">
          <AvatarImage className="animate-in fade-in-0 duration-300" src={user.image!} />
          <AvatarFallback className="bg-zinc-100 text-xl font-medium text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
            {user.name?.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* User Info */}
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-zinc-900 sm:text-4xl dark:text-zinc-100">
          {user.name}
        </h1>
        {user.handle && (
          <p className="text-base text-zinc-500 dark:text-zinc-400">@{user.handle}</p>
        )}

        {/* Stats */}
        <div className="!mt-8 flex justify-center">
          <div className="divide-material-ultra-thick flex items-center divide-x">
            <div className="px-4 text-center">
              <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {totalFeeds}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Subscriptions</div>
            </div>
            <div className="px-4 text-center">
              <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {Object.keys(subscriptions.data || {}).length}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Lists = ({ userId }: { userId: string }) => {
  const lists = useListsByUserId(userId)
  if (lists.isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingCircle size="large" />
        </div>
      </div>
    )
  }

  if (!lists.data || lists.data.length === 0) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-16 sm:px-8">
      <div className="border-border/40 mb-6 border-b pb-3">
        <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">Created Lists</h2>
      </div>
      <div data-testid="profile-lists" className="flex flex-col space-y-4">
        {lists.data?.map((list) => (
          <a
            key={list.id}
            href={UrlBuilder.shareList(list.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="group/card border-border/40 relative flex items-start space-x-4 overflow-hidden border-b pb-4 last:border-0"
          >
            <FeedIcon
              fallback
              feed={list}
              className="mask-squircle mask border-border border"
              size={80}
              noMargin
            />

            <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
              <div>
                <h3 className="group-hover/card:text-accent truncate font-medium text-zinc-900 transition-colors dark:text-zinc-100">
                  {list.title}
                </h3>
                {list.description && (
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {list.description}
                  </p>
                )}
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-zinc-500 dark:text-zinc-400">
                {typeof list.subscriptionCount === "number" && (
                  <div className="flex items-center space-x-1">
                    <i className="i-mingcute-group-2-line" />
                    <span>
                      {list.subscriptionCount}
                      <span className="hidden sm:inline">
                        {list.subscriptionCount > 1 ? " Subscriptions" : " Subscription"}
                      </span>
                    </span>
                  </div>
                )}
                {typeof list.fee === "number" && list.fee > 0 && (
                  <div className="flex items-center space-x-1">
                    <i className="i-mingcute-copper-coin-line" />
                    <span>{list.fee}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="absolute bottom-4 right-4">
              <Button
                size="sm"
                variant="primary"
                buttonClassName="opacity-0 transition-opacity group-hover/card:opacity-100"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  openInFollowApp({
                    deeplink: `list?id=${list.id}`,
                    fallbackUrl: `/list/${list.id}`,
                  })
                }}
              >
                <FollowIcon className="mr-1.5 size-3" />
                Open in {APP_NAME}
              </Button>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

const Subscriptions = ({ userId }: { userId: string }) => {
  const subscriptions = useUserSubscriptionsQuery(userId)

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }
  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-8">
      {subscriptions.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingCircle size="large" />
        </div>
      ) : (
        <div data-testid="profile-subscriptions" className="space-y-8">
          {Object.keys(subscriptions.data || {}).map((category) => {
            const isExpanded = expandedCategories[category] ?? true

            return (
              <div key={category} className="group">
                {/* Category Header */}
                <button
                  type="button"
                  className="border-border/40 hover:border-border/60 mb-6 flex w-full items-center justify-between border-b pb-3 text-left transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
                    {category}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {subscriptions.data?.[category]?.length || 0}
                    </span>
                    <i
                      className={cn(
                        "i-mingcute-down-line text-zinc-400 transition-transform duration-200",
                        isExpanded && "rotate-180",
                      )}
                    />
                  </div>
                </button>

                {/* Feeds Grid with collapse animation */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-out",
                    isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {subscriptions.data?.[category]!.map(
                      (subscription) =>
                        "feeds" in subscription && (
                          <FeedCard
                            key={subscription.feedId}
                            subscription={subscription}
                            feedId={subscription.feedId}
                            view={subscription.view}
                          />
                        ),
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
