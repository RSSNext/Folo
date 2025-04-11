import { FeedViewType } from "@follow/constants"
import dayjs from "dayjs"
import { setStringAsync } from "expo-clipboard"
import { t } from "i18next"
import type { CSSProperties, FC, PropsWithChildren } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ListRenderItemInfo } from "react-native"
import { Alert, FlatList, View } from "react-native"

import { ContextMenu } from "@/src/components/ui/context-menu"
import { views } from "@/src/constants/views"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { Navigation } from "@/src/lib/navigation/Navigation"
import { toast } from "@/src/lib/toast"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]"
import { useEntryIdsByFeedId, usePrefetchEntries } from "@/src/store/entry/hooks"
import { getFeed } from "@/src/store/feed/getter"
import { getSubscription } from "@/src/store/subscription/getter"
import { getSubscriptionCategory } from "@/src/store/subscription/hooks"
import { subscriptionSyncService } from "@/src/store/subscription/store"
import { unreadSyncService } from "@/src/store/unread/store"

import { ItemSeparator } from "../entry-list/ItemSeparator"
import { EntryNormalItem } from "../entry-list/templates/EntryNormalItem"
import { getSelectedView } from "../screen/atoms"

export const SubscriptionFeedItemContextMenu: FC<
  PropsWithChildren & {
    id: string
  }
> = ({ id, children }) => {
  const navigation = useNavigation()
  const [open, setOpen] = useState(false)
  const [Content, setContent] = useState<React.ReactNode>(() =>
    generateSubscriptionContextMenu(navigation, id),
  )

  useEffect(() => {
    if (open) {
      setContent(generateSubscriptionContextMenu(navigation, id))
    }
  }, [id, navigation, open])

  return (
    <ContextMenu.Root onOpenChange={setOpen}>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      {Content}
    </ContextMenu.Root>
  )
}

const generateSubscriptionContextMenu = (navigation: Navigation, id: string) => {
  const view = getSelectedView()

  const feed = getFeed(id)
  const allCategories = getSubscriptionCategory(view)

  return (
    <ContextMenu.Content>
      {view === FeedViewType.Articles && (
        <ContextMenu.Preview
          size="STRETCH"
          onPress={() => {
            navigation.pushControllerView(FeedScreen, {
              feedId: id,
            })
          }}
        >
          {() => <PreviewFeeds id={id} view={view!} />}
        </ContextMenu.Preview>
      )}

      {!!feed?.errorAt && (
        <ContextMenu.Item
          key="ShowErrorMessage"
          onSelect={() => {
            Alert.alert(
              `${t("operation.error_since")} ${dayjs
                .duration(dayjs(feed.errorAt).diff(dayjs(), "minute"), "minute")
                .humanize(true)}`,
              feed.errorMessage ?? undefined,
            )
          }}
        >
          <ContextMenu.ItemTitle>{t("operation.show_error_message")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "exclamationmark.triangle",
            }}
          />
        </ContextMenu.Item>
      )}
      <ContextMenu.Item
        key="MarkAllAsRead"
        onSelect={() => {
          unreadSyncService.markFeedAsRead(id)
        }}
      >
        <ContextMenu.ItemTitle>{t("operation.mark_all_as_read")}</ContextMenu.ItemTitle>
        <ContextMenu.ItemIcon
          ios={{
            name: "checkmark.circle",
          }}
        />
      </ContextMenu.Item>

      {/* <ContextMenu.Item key="Claim">
      <ContextMenu.ItemTitle>Claim</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon
        ios={{
          name: "checkmark.seal",
        }}
      />
    </ContextMenu.Item> */}

      {/* <ContextMenu.Item key="Boost">
      <ContextMenu.ItemTitle>Boost</ContextMenu.ItemTitle>
      <ContextMenu.ItemIcon
        ios={{
          name: "bolt",
        }}
      />
    </ContextMenu.Item> */}

      <ContextMenu.Sub key="AddToCategory">
        <ContextMenu.SubTrigger key="SubTrigger/AddToCategory">
          <ContextMenu.ItemTitle>{t("operation.add_feeds_to_category")}</ContextMenu.ItemTitle>
        </ContextMenu.SubTrigger>

        <ContextMenu.SubContent>
          <>
            {allCategories.map((category) => {
              const onSelect = () => {
                const subscription = getSubscription(id)
                if (!subscription) return

                // add to category
                subscriptionSyncService.edit({
                  ...subscription,
                  category,
                })
              }
              return (
                <ContextMenu.Item key={`SubContent/${category}`} onSelect={onSelect}>
                  <ContextMenu.ItemTitle>{category}</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )
            })}
          </>
          <ContextMenu.Item
            key={`SubContent/CreateNewCategory`}
            onSelect={() => {
              // create new category
              const subscription = getSubscription(id)
              if (!subscription) return
              Alert.prompt("Create New Category", "Enter the name of the new category", (text) => {
                subscriptionSyncService.edit({
                  ...subscription,
                  category: text,
                })
              })
            }}
          >
            <ContextMenu.ItemTitle>Create New Category</ContextMenu.ItemTitle>
            <ContextMenu.ItemIcon ios={{ name: "plus" }} />
          </ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>

      <ContextMenu.Item key="Edit">
        <ContextMenu.ItemTitle>{t("operation.edit")}</ContextMenu.ItemTitle>
        <ContextMenu.ItemIcon
          ios={{
            name: "square.and.pencil",
          }}
        />
      </ContextMenu.Item>

      <ContextMenu.Item
        key="CopyLink"
        onSelect={() => {
          const subscription = getSubscription(id)
          if (!subscription) return

          switch (subscription.type) {
            case "feed": {
              if (!subscription.feedId) return
              const feed = getFeed(subscription.feedId)
              if (!feed) return
              setStringAsync(feed.url)
              toast.success("Link copied to clipboard")
              return
            }
          }
        }}
      >
        <ContextMenu.ItemTitle>{t("operation.copy_link")}</ContextMenu.ItemTitle>
        <ContextMenu.ItemIcon
          ios={{
            name: "link",
          }}
        />
      </ContextMenu.Item>

      <ContextMenu.Item
        key="Unsubscribe"
        destructive
        onSelect={() => {
          // unsubscribe
          Alert.alert("Unsubscribe?", "This will remove the feed from your subscriptions", [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: t("operation.unfollow"),
              style: "destructive",
              onPress: () => {
                subscriptionSyncService.unsubscribe(id)
              },
            },
          ])
        }}
      >
        <ContextMenu.ItemTitle>{t("operation.unfollow")}</ContextMenu.ItemTitle>
        <ContextMenu.ItemIcon
          ios={{
            name: "xmark",
          }}
        />
      </ContextMenu.Item>
    </ContextMenu.Content>
  )
}

export const SubscriptionFeedCategoryContextMenu = ({
  feedIds,

  children,
  asChild,
  style,
}: PropsWithChildren<{
  feedIds: string[]

  asChild?: boolean
  style?: CSSProperties
}>) => {
  const { t } = useTranslation()
  const [currentView, setCurrentView] = useState<FeedViewType>(FeedViewType.Articles)

  return (
    <ContextMenu.Root
      onOpenChange={(open) => {
        if (open) {
          setCurrentView(getSelectedView())
        }
      }}
    >
      <ContextMenu.Trigger asChild={asChild} style={style}>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Item
          key="MarkAllAsRead"
          onSelect={useCallback(() => {
            unreadSyncService.markFeedAsRead(feedIds)
          }, [feedIds])}
        >
          <ContextMenu.ItemTitle>{t("operation.mark_all_as_read")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "checkmark.circle",
            }}
          />
        </ContextMenu.Item>

        <ContextMenu.Sub key="ChangeToOtherView">
          <ContextMenu.SubTrigger key="SubTrigger/ChangeToOtherView">
            <ContextMenu.ItemTitle>{t("operation.change_to_other_view")}</ContextMenu.ItemTitle>
          </ContextMenu.SubTrigger>

          <ContextMenu.SubContent>
            {views.map((view) => {
              const isSelected = view.view === currentView
              return (
                <ContextMenu.CheckboxItem
                  key={`SubContent/${view.name}`}
                  value={isSelected}
                  // onSelect={onSelect}
                >
                  <ContextMenu.ItemTitle>{t(view.name as any)}</ContextMenu.ItemTitle>
                </ContextMenu.CheckboxItem>
              )
            })}
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Item key="EditCategory">
          <ContextMenu.ItemTitle>{t("operation.rename_category")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "square.and.pencil",
            }}
          />
        </ContextMenu.Item>
        <ContextMenu.Item key="DeleteCategory" destructive>
          <ContextMenu.ItemTitle>{t("operation.delete_category")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "trash",
            }}
          />
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}

const PreviewFeeds = (props: { id: string; view: FeedViewType }) => {
  const { id: feedId } = props
  const entryIds = useEntryIdsByFeedId(feedId)
  usePrefetchEntries({ feedId, limit: 5 })

  const renderItem = useCallback(
    ({ item: id }: ListRenderItemInfo<string>) => <EntryNormalItem entryId={id} extraData="" />,
    [],
  )
  return (
    <View className="bg-system-background size-full flex-1">
      <FlatList
        scrollEnabled={false}
        data={useMemo(() => entryIds?.slice(0, 5), [entryIds])}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  )
}
