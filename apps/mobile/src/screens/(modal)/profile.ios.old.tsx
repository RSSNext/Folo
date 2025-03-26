import type { FeedViewType } from "@follow/constants"
import { requireNativeView } from "expo"
import { useEffect, useMemo } from "react"
import { ActivityIndicator, View } from "react-native"

import type { apiClient } from "@/src/lib/api-fetch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { useShareSubscription } from "@/src/modules/settings/hooks/useShareSubscription"
import type { FeedModel } from "@/src/store/feed/types"
import type { ListModel } from "@/src/store/list/store"
import { useWhoami } from "@/src/store/user/hooks"

const ProfileView = requireNativeView("ProfileView")
type Subscription = Awaited<ReturnType<typeof apiClient.subscriptions.$get>>["data"][number]

export const ProfileScreen: NavigationControllerView<{
  userId: string
}> = ({ userId }) => {
  const whoami = useWhoami()

  if (!whoami) {
    return null
  }
  return <ProfileScreenImpl userId={userId || whoami?.id} />
}

function ProfileScreenImpl(props: { userId: string }) {
  const {
    data: subscriptions,
    isLoading,
    isError,
  } = useShareSubscription({
    userId: props.userId,
  })

  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch subscriptions")
    }
  }, [isError])

  return (
    <View className="bg-system-grouped-background flex-1">
      {isLoading && <ActivityIndicator className="mt-24" size={28} />}
      {!isLoading && subscriptions && <SubscriptionList subscriptions={subscriptions.data} />}
    </View>
  )
}

type PickedListModel = Pick<ListModel, "id" | "title" | "image" | "description" | "view"> & {
  customTitle?: string | null
}
type PickedFeedModel = Pick<
  FeedModel,
  "id" | "title" | "description" | "siteUrl" | "url" | "image"
> & {
  customTitle?: string | null
  view: FeedViewType
}
const SubscriptionList = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  const { lists, feeds, groupedFeeds } = useMemo(() => {
    const lists = [] as PickedListModel[]
    const feeds = [] as PickedFeedModel[]

    const groupedFeeds = {} as Record<string, PickedFeedModel[]>

    for (const subscription of subscriptions) {
      if ("listId" in subscription) {
        lists.push({
          id: subscription.listId,
          title: subscription.lists.title!,
          image: subscription.lists.image!,
          description: subscription.lists.description!,
          view: subscription.lists.view,
          customTitle: subscription.title,
        })
        continue
      }

      if ("feedId" in subscription && "feeds" in subscription) {
        const feed = {
          id: subscription.feedId,
          title: subscription.feeds.title!,
          image: subscription.feeds.image!,
          description: subscription.feeds.description!,
          siteUrl: subscription.feeds.siteUrl!,
          url: subscription.feeds.url!,
          view: subscription.view as FeedViewType,
          customTitle: subscription.title,
        }

        if (subscription.category) {
          groupedFeeds[subscription.category] = [
            ...(groupedFeeds[subscription.category] || []),
            feed,
          ]
        } else {
          feeds.push(feed)
        }
      }
    }
    return { lists, feeds, groupedFeeds }
  }, [subscriptions])

  const user = useWhoami()
  return (
    <ProfileView
      style={{ flex: 1 }}
      payload={JSON.stringify({
        user,
        profile: { lists, feeds, groupedFeeds },
      })}
    />
  )
}
