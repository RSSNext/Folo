import { FeedViewType } from "@follow/constants"
import { useEntriesQuery, useEntryIdsByFeedId } from "@follow/store/entry/hooks"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { getSubscriptionById } from "@follow/store/subscription/getter"
import { useCategories } from "@follow/store/subscription/hooks"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { unreadSyncService } from "@follow/store/unread/store"
import dayjs from "dayjs"
import { setStringAsync } from "expo-clipboard"
import { t } from "i18next"
import type { CSSProperties, FC, PropsWithChildren } from "react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { ListRenderItemInfo } from "react-native"
import { Alert, FlatList, View } from "react-native"

import { useFetchEntriesSettings } from "@/src/atoms/settings/general"
import { ContextMenu } from "@/src/components/ui/context-menu"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { modalPrompt } from "@/src/components/ui/modal/imperative-modal"
import { views } from "@/src/constants/views"
import { toastFetchError } from "@/src/lib/error-parser"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { Navigation } from "@/src/lib/navigation/Navigation"
import { isIOS } from "@/src/lib/platform"
import { toast } from "@/src/lib/toast"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]/FeedScreen"

import { ItemSeparator } from "../entry-list/ItemSeparator"
import { EntryNormalItem } from "../entry-list/templates/EntryNormalItem"
import { getSelectedView, selectFeed, useSelectedView } from "../screen/atoms"

export const SubscriptionFeedItemContextMenu: FC<
  PropsWithChildren & {
    id: string
  }
> = ({ id, children }) => {
  const navigation = useNavigation()
  // Built from the current state on every change. Rebuilding it when the menu opens comes too
  // late on Android, whose native menu is already showing the items it had.
  const view = useSelectedView()
  const allCategories = useCategories(view)
  const feedErrorAt = useFeedById(id, (feed) => feed.errorAt)
  const content = useMemo(
    () => generateSubscriptionContextMenu(navigation, id, view, allCategories),
    // The menu reads the feed's error when it is built.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [navigation, id, view, allCategories, feedErrorAt],
  )

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      {content}
    </ContextMenu.Root>
  )
}

const generateSubscriptionContextMenu = (
  navigation: Navigation,
  id: string,
  view: FeedViewType,
  allCategories: string[],
) => {
  const feed = getFeedById(id)

  return (
    <ContextMenu.Content>
      {view === FeedViewType.Articles && (
        <ContextMenu.Preview
          size="STRETCH"
          onPress={() => {
            // FeedScreen shows the selected feed, not the one it is pushed with
            selectFeed({ type: "feed", feedId: id })
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
                const subscription = getSubscriptionById(id)
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
              if (!getSubscriptionById(id)) return
              const prompt = isIOS ? Alert.prompt : modalPrompt

              prompt(
                t("operation.create_new_category"),
                t("operation.enter_name_for_new_category"),
                (text) => {
                  // Read once the name is in: another device may have edited the feed meanwhile,
                  // and an older copy would write those fields back.
                  const subscription = getSubscriptionById(id)
                  if (!subscription) return
                  subscriptionSyncService.edit({
                    ...subscription,
                    category: text,
                  })
                },
              )
            }}
          >
            <ContextMenu.ItemTitle>{t("operation.create_new_category")}</ContextMenu.ItemTitle>
            <ContextMenu.ItemIcon ios={{ name: "plus" }} />
          </ContextMenu.Item>
        </ContextMenu.SubContent>
      </ContextMenu.Sub>

      <ContextMenu.Item
        key="Edit"
        onSelect={() => {
          const subscription = getSubscriptionById(id)
          if (!subscription || !subscription.feedId) return

          navigation.presentControllerView(FollowScreen, {
            type: "feed",
            id: subscription.feedId,
          })
        }}
      >
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
          const subscription = getSubscriptionById(id)
          if (!subscription) return

          switch (subscription.type) {
            case "feed": {
              if (!subscription.feedId) return
              const feed = getFeedById(subscription.feedId)
              if (!feed) return
              setStringAsync(feed.url)
              toast.success(t("operation.copy_which_success", { which: t("operation.copy.link") }))
              return
            }
          }
        }}
      >
        <ContextMenu.ItemTitle>
          {t("operation.copy_which", {
            which: t("operation.copy.link"),
          })}
        </ContextMenu.ItemTitle>
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
          Alert.alert(t("feed.unfollow.confirm_title"), t("feed.unfollow.confirm_description"), [
            {
              text: t("words.cancel", { ns: "common" }),
              style: "cancel",
            },
            {
              text: t("operation.unfollow"),
              style: "destructive",
              onPress: async () => {
                try {
                  await subscriptionSyncService.unsubscribe(id)
                } catch (error) {
                  // The store puts the feed back, which alone would not say why
                  toastFetchError(error instanceof Error ? error : new Error(String(error)))
                }
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
  category,

  children,
  asChild,
  style,
}: PropsWithChildren<{
  feedIds: string[]
  category: string

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
                  onSelect={() => {
                    subscriptionSyncService.changeCategoryView({
                      category,
                      currentView,
                      newView: view.view,
                    })
                  }}
                >
                  <ContextMenu.ItemTitle>{t(view.name, { ns: "common" })}</ContextMenu.ItemTitle>
                </ContextMenu.CheckboxItem>
              )
            })}
          </ContextMenu.SubContent>
        </ContextMenu.Sub>

        <ContextMenu.Item
          key="EditCategory"
          onSelect={() => {
            const prompt = isIOS ? Alert.prompt : modalPrompt

            const handleRenameCategory = async (newCategory: string) => {
              if (!newCategory) return
              await subscriptionSyncService.renameCategory({
                lastCategory: category,
                newCategory,
                view: currentView,
              })
              toast.success(t("operation.rename_category_success"))
            }
            prompt(
              t("operation.rename_category"),
              t("operation.enter_new_name_for_category", {
                category,
              }),
              handleRenameCategory,
              undefined,
              category,
            )
          }}
        >
          <ContextMenu.ItemTitle>{t("operation.rename_category")}</ContextMenu.ItemTitle>
          <ContextMenu.ItemIcon
            ios={{
              name: "square.and.pencil",
            }}
          />
        </ContextMenu.Item>
        <ContextMenu.Item
          key="DeleteCategory"
          destructive
          onSelect={() => {
            Alert.alert(
              t("operation.delete_category_which", { category }),
              t("operation.delete_category_confirm"),
              [
                {
                  text: t("words.cancel", { ns: "common" }),
                  style: "cancel",
                },
                {
                  text: t("words.delete", { ns: "common" }),
                  style: "destructive",
                  onPress: () => {
                    subscriptionSyncService.deleteCategory({ category, view: currentView })
                  },
                },
              ],
            )
          }}
        >
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
  const options = useFetchEntriesSettings({
    isTimelineSource: false,
    unreadOnlyEnabled: false,
  })
  const { isLoading } = useEntriesQuery({ feedId, limit: 5, ...options })
  const previewEntryIds = useMemo(() => entryIds?.slice(0, 5), [entryIds])

  const renderItem = useCallback(
    ({ item: id }: ListRenderItemInfo<string>) => (
      <EntryNormalItem
        entryId={id}
        extraData={{ entryIds: null }}
        view={props.view}
        isTimelineSource={false}
      />
    ),
    [props.view],
  )
  return (
    <View className="size-full flex-1 bg-system-background">
      {isLoading && !entryIds?.length && (
        <PlatformActivityIndicator className="absolute inset-0 flex items-center justify-center" />
      )}
      <FlatList
        scrollEnabled={false}
        data={previewEntryIds}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  )
}
