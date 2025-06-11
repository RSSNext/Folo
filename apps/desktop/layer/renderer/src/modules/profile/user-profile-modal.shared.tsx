import { useMobile } from "@follow/components/hooks/useMobile.js"
import { FollowIcon } from "@follow/components/icons/follow.jsx"
import { AutoResizeHeight } from "@follow/components/ui/auto-resize-height/index.jsx"
import { Avatar, AvatarFallback, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { LoadingWithIcon } from "@follow/components/ui/loading/index.jsx"
import { EllipsisHorizontalTextWithTooltip } from "@follow/components/ui/typography/index.js"
import type { SubscriptionModel } from "@follow/models/types"
import { useIsSubscribed } from "@follow/store/subscription/hooks"
import { usePrefetchUser, useUserById } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import { AnimatePresence } from "motion/react"
import type { FC } from "react"
import { memo, useState } from "react"
import { useEventCallback } from "usehooks-ts"

import { m } from "~/components/common/Motion"
import { useFollow } from "~/hooks/biz/useFollow"
import { useI18n } from "~/hooks/common"
import { replaceImgUrlIfNeed } from "~/lib/img-proxy"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { useUserSubscriptionsQuery } from "~/modules/profile/hooks"

type ItemVariant = "loose" | "compact"

export interface SubscriptionModalContentProps {
  userId: string

  variant?: "drawer" | "dialog"
}
export const SubscriptionItems = ({
  userId,
  itemStyle,
}: {
  userId: string
  itemStyle: ItemVariant
}) => {
  const profile = usePrefetchUser(userId)
  const userInfo = useUserById(userId)
  const subscriptions = useUserSubscriptionsQuery(userId)
  const renderUserData = profile.data || userInfo

  return subscriptions.isLoading ? (
    <LoadingWithIcon
      size="large"
      icon={
        <Avatar className="aspect-square size-4">
          <AvatarImage src={replaceImgUrlIfNeed(renderUserData?.image || undefined)} />
          <AvatarFallback>{renderUserData?.name?.slice(0, 2)}</AvatarFallback>
        </Avatar>
      }
      className="center h-48 w-full max-w-full"
    />
  ) : (
    subscriptions.data && (
      <div className="flex w-full">
        <div className="relative flex w-0 grow flex-col">
          {Object.keys(subscriptions.data).map((category) => (
            <SubscriptionGroup
              key={category}
              category={category}
              subscriptions={subscriptions.data?.[category]!}
              itemStyle={itemStyle}
            />
          ))}
        </div>
      </div>
    )
  )
}

export const SubscriptionGroup: FC<{
  category: string
  subscriptions: SubscriptionModel[]
  itemStyle: ItemVariant
}> = memo(({ category, subscriptions, itemStyle }) => {
  const [isOpened, setIsOpened] = useState(true)
  return (
    <div>
      <button
        onClick={() => setIsOpened(!isOpened)}
        className="mb-2 mt-8 flex w-full items-center justify-between font-bold"
        type="button"
      >
        <h3 className="min-w-0 pr-1">
          <EllipsisHorizontalTextWithTooltip className="min-w-0 truncate">
            {category}
          </EllipsisHorizontalTextWithTooltip>
        </h3>

        <div className="inline-flex shrink-0 items-center opacity-50">
          <i
            className={cn("i-mingcute-down-line size-5 duration-200", isOpened ? "rotate-180" : "")}
          />
        </div>
      </button>
      <AutoResizeHeight>
        <AnimatePresence mode="popLayout">
          {isOpened && (
            <div>
              {subscriptions.map((subscription) => (
                <SubscriptionItem
                  variant={itemStyle}
                  key={subscription.feedId}
                  subscription={subscription}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </AutoResizeHeight>
    </div>
  )
})

const SubscriptionItem: FC<{
  subscription: SubscriptionModel

  variant: ItemVariant
}> = ({ subscription, variant }) => {
  const t = useI18n()
  const isFollowed = useIsSubscribed(subscription.feedId)
  const follow = useFollow()
  const isLoose = variant === "loose"
  const handleFollow = useEventCallback((e: React.MouseEvent) => {
    if (!("feeds" in subscription)) return
    e.stopPropagation()
    e.preventDefault()

    const defaultView = subscription.view

    follow({
      id: subscription.feedId,
      url: subscription.feeds.url,
      isList: false,
      defaultValues: {
        view: defaultView.toString(),
      },
    })
  })

  const isMobile = useMobile()
  if (!("feeds" in subscription)) return null

  return (
    <m.div
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      className={cn("group relative pl-1", isLoose ? "border-b py-5 last:border-b-0" : "py-2")}
      data-feed-id={subscription.feedId}
    >
      <a
        className="cursor-menu flex flex-1 items-center"
        href={subscription.feeds.siteUrl!}
        target="_blank"
        onClick={isMobile ? handleFollow : undefined}
      >
        <FeedIcon feed={subscription.feeds} size={22} className="mr-3" />
        <div
          className={cn(
            "w-0 flex-1 grow",
            "group-hover:grow-[0.85]",
            !isLoose && "flex items-center",
          )}
        >
          <div className="truncate font-medium leading-tight">{subscription.feeds?.title}</div>
          {isLoose && (
            <div className="mt-1 line-clamp-1 text-xs text-zinc-500">
              {subscription.feeds?.description}
            </div>
          )}
        </div>
        {!isMobile && (
          <div className="absolute right-0 opacity-0 transition-opacity group-hover:opacity-100">
            <Button onClick={handleFollow}>
              {isFollowed ? (
                t("user_profile.edit")
              ) : (
                <>
                  <FollowIcon className="mr-1 size-3" />
                  {t("feed_form.follow")}
                </>
              )}
            </Button>
          </div>
        )}
      </a>
    </m.div>
  )
}
