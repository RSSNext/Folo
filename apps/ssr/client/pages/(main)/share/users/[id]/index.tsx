import { MainContainer } from "@client/components/layout/main"
import { FeedIcon } from "@client/components/ui/feed-icon"
import { openInFollowApp } from "@client/lib/helper"
import { UrlBuilder } from "@client/lib/url-builder"
import { useUserQuery, useUserSubscriptionsQuery } from "@client/query/users"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { Button } from "@follow/components/ui/button/index.jsx"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { useTitle } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import { Fragment } from "react"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router"

export const Component = () => {
  const params = useParams()

  const user = useUserQuery(params.id)

  const subscriptions = useUserSubscriptionsQuery(user.data?.id)

  useTitle(user.data?.name)

  const { t } = useTranslation()

  return (
    <MainContainer className="items-center">
      {user.isLoading ? (
        <LoadingCircle size="large" className="center fixed inset-0" />
      ) : (
        <Fragment>
          <Avatar className="aspect-square size-16">
            <AvatarImage className="animate-in fade-in-0 duration-200" src={user.data?.image} />
            <AvatarFallback>{user.data?.name?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-2 mt-4 flex items-center text-2xl font-bold">
              <h1>{user.data?.name}</h1>
            </div>
            {user.data?.handle && (
              <div className="mb-2 text-sm text-zinc-500">@{user.data.handle}</div>
            )}
          </div>
          <div
            className="mb-12 w-[70ch] max-w-full grow space-y-10"
            data-testid="profile-subscriptions"
          >
            {subscriptions.isLoading ? (
              <LoadingCircle size="large" className="center fixed inset-0" />
            ) : (
              Object.keys(subscriptions.data || {}).map((category) => (
                <div key={category}>
                  <div className="mb-4 flex items-center text-2xl font-bold">
                    <h3>{category}</h3>
                  </div>
                  <div>
                    {subscriptions.data?.[category]!.map(
                      (subscription) =>
                        "feeds" in subscription && (
                          <div key={subscription.feedId} className="group relative border-b py-5">
                            <a
                              className="cursor-button flex flex-1"
                              href={UrlBuilder.shareFeed(subscription.feedId)}
                              target="_blank"
                            >
                              <FeedIcon
                                fallback
                                feed={subscription.feeds}
                                size={22}
                                className="mr-3"
                              />
                              <div
                                className={cn(
                                  "flex w-0 flex-1 grow flex-col justify-center",
                                  "group-hover:grow-[0.85]",
                                )}
                              >
                                <div className="truncate font-medium leading-none">
                                  {subscription.feeds?.title}
                                </div>
                                {subscription.feeds?.description && (
                                  <div className="mt-1 line-clamp-1 text-xs text-zinc-500">
                                    {subscription.feeds.description}
                                  </div>
                                )}
                              </div>
                            </a>
                            <span className="center absolute inset-y-0 right-0 opacity-0 transition-opacity group-hover:opacity-100">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openInFollowApp({
                                    deeplink: `feed?id=${subscription.feedId}&view=${subscription.view}`,
                                    fallbackUrl: `/timeline/view-${subscription.view}/${subscription.feedId}/pending`,
                                  })
                                }}
                              >
                                <FollowIcon className="mr-1 size-3" />
                                {t("feed.actions.open", { which: APP_NAME })}
                              </Button>
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Fragment>
      )}
    </MainContainer>
  )
}
