import type { FeedViewType } from "@follow/constants"
import { IN_ELECTRON } from "@follow/shared/constants"
import { env } from "@follow/shared/env.desktop"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { useInboxById, useIsInbox } from "@follow/store/inbox/hooks"
import { useListById, useOwnedListByView } from "@follow/store/list/hooks"
import { listSyncServices } from "@follow/store/list/store"
import {
  useCategoriesByView,
  useSubscriptionByFeedId,
  useSubscriptionsByFeedIds,
} from "@follow/store/subscription/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { isBizId } from "@follow/utils/utils"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { FollowMenuItem, MenuItemInput } from "~/atoms/context-menu"
import { MenuItemSeparator, MenuItemText } from "~/atoms/context-menu"
import { useIsInMASReview } from "~/atoms/server-configs"
import { whoami } from "~/atoms/user"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { UrlBuilder } from "~/lib/url-builder"
import { useBoostModal } from "~/modules/boost/hooks"
import { useFeedClaimModal } from "~/modules/claim"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandShortcuts } from "~/modules/command/hooks/use-command-binding"
import { FeedForm } from "~/modules/discover/FeedForm"
import { InboxForm } from "~/modules/discover/InboxForm"
import { ListForm } from "~/modules/discover/ListForm"
import { useConfirmUnsubscribeSubscriptionModal } from "~/modules/modal/hooks/useConfirmUnsubscribeSubscriptionModal"
import { useCategoryCreationModal } from "~/modules/settings/tabs/lists/hooks"
import { ListCreationModalContent } from "~/modules/settings/tabs/lists/modals"
import { useResetFeed } from "~/queries/feed"

import { useNavigateEntry } from "./useNavigateEntry"
import { getRouteParams } from "./useRouteParams"
import { useBatchUpdateSubscription, useDeleteSubscription } from "./useSubscriptionActions"

export const useFeedActions = ({
  feedId,
  feedIds,
  view,
  type,
}: {
  feedId: string
  feedIds?: string[]
  view?: number
  type?: "feedList" | "entryList"
}) => {
  const { t } = useTranslation()
  const feed = useFeedById(feedId, (feed) => {
    return {
      type: feed.type,
      ownerUserId: feed.ownerUserId,
      id: feed.id,
      url: feed.url,
      siteUrl: feed.siteUrl,
    }
  })

  const inbox = useInboxById(feedId)
  const isInbox = !!inbox
  const subscription = useSubscriptionByFeedId(feedId)

  const subscriptions = useSubscriptionsByFeedIds(
    useMemo(() => feedIds || [feedId], [feedId, feedIds]),
  )
  const { present } = useModalStack()
  const presentDeleteSubscription = useConfirmUnsubscribeSubscriptionModal()
  const deleteSubscription = useDeleteSubscription({})
  const claimFeed = useFeedClaimModal()

  const navigateEntry = useNavigateEntry()
  const isEntryList = type === "entryList"

  const { mutateAsync: addFeedToListMutation } = useAddFeedToFeedList()
  const { mutateAsync: removeFeedFromListMutation } = useRemoveFeedFromFeedList()
  const { mutateAsync: resetFeed } = useResetFeed()
  const { mutate: addFeedsToCategoryMutation } = useBatchUpdateSubscription()
  const presentCategoryCreationModal = useCategoryCreationModal()
  const openBoostModal = useBoostModal()

  const listByView = useOwnedListByView(view!)
  const categories = useCategoriesByView(view!)

  const isMultipleSelection = feedIds && feedIds.length > 1 && feedIds.includes(feedId)

  const isInMASReview = useIsInMASReview()

  const shortcuts = useCommandShortcuts()

  const items = useMemo(() => {
    const related = feed || inbox
    if (!related) return []

    const isFeedOwner = related.ownerUserId === whoami()?.id

    const items: MenuItemInput[] = [
      new MenuItemText({
        label: t("sidebar.feed_actions.mark_all_as_read"),
        shortcut: shortcuts[COMMAND_ID.subscription.markAllAsRead],
        disabled: isEntryList,
        click: () => unreadSyncService.markFeedAsRead(isMultipleSelection ? feedIds : [feedId]),
        supportMultipleSelection: true,
      }),
      !related.ownerUserId &&
        !!isBizId(related.id) &&
        related.type === "feed" &&
        new MenuItemText({
          label: isEntryList
            ? t("sidebar.feed_actions.claim_feed")
            : t("sidebar.feed_actions.claim"),
          shortcut: "C",
          click: () => {
            claimFeed({ feedId })
          },
        }),
      ...(isFeedOwner
        ? [
            MenuItemSeparator.default,
            new MenuItemText({
              label: t("sidebar.feed_actions.feed_owned_by_you"),
              disabled: true,
            }),
            new MenuItemText({
              label: t("sidebar.feed_actions.reset_feed"),
              click: () => {
                resetFeed(feedId)
              },
            }),
            MenuItemSeparator.default,
          ]
        : []),
      ...(!isInMASReview
        ? [
            new MenuItemText({
              label: t("words.boost"),
              click: () => {
                openBoostModal(feedId)
              },
            }),
          ]
        : []),

      new MenuItemSeparator(isEntryList),
      new MenuItemText({
        label: t("sidebar.feed_column.context_menu.add_feeds_to_list"),
        disabled: isInbox,
        supportMultipleSelection: true,
        submenu: [
          ...listByView.map((list) => {
            const isIncluded = list.feedIds.includes(feedId)
            return new MenuItemText({
              label: list.title || "",
              checked: isIncluded,
              click() {
                if (isMultipleSelection) {
                  addFeedToListMutation({
                    feedIds,
                    listId: list.id,
                  })
                  return
                }

                if (!isIncluded) {
                  addFeedToListMutation({
                    feedId,
                    listId: list.id,
                  })
                } else {
                  removeFeedFromListMutation({
                    feedId,
                    listId: list.id,
                  })
                }
              },
            })
          }),
          listByView.length > 0 && new MenuItemSeparator(),
          new MenuItemText({
            label: t("sidebar.feed_actions.create_list"),
            icon: <i className="i-mgc-add-cute-re" />,
            click() {
              present({
                title: t("sidebar.feed_actions.create_list"),
                content: () => <ListCreationModalContent />,
              })
            },
          }),
        ],
      }),
      new MenuItemText({
        label: t("sidebar.feed_column.context_menu.add_feeds_to_category"),
        disabled: isInbox,
        supportMultipleSelection: true,
        submenu: [
          ...Array.from(categories.values()).map((category) => {
            const isIncluded = isMultipleSelection
              ? subscriptions.every((s) => s!.category === category)
              : subscription?.category === category
            return new MenuItemText({
              label: category,
              checked: isIncluded,
              click() {
                addFeedsToCategoryMutation({
                  feedIdList: isMultipleSelection ? feedIds : [feedId],
                  category: isIncluded ? null : category, // if already included, remove it
                  view: view!,
                })
              },
            })
          }),
          listByView.length > 0 && MenuItemSeparator.default,
          new MenuItemText({
            label: t("sidebar.feed_column.context_menu.create_category"),
            icon: <i className="i-mgc-add-cute-re" />,
            click() {
              presentCategoryCreationModal(view!, isMultipleSelection ? feedIds : [feedId])
            },
          }),
        ],
      }),
      new MenuItemSeparator(isEntryList),
      new MenuItemText({
        label: isEntryList ? t("sidebar.feed_actions.edit_feed") : t("sidebar.feed_actions.edit"),
        shortcut: "E",
        disabled: isInbox,
        click: () => {
          present({
            modalContentClassName: "overflow-visible",
            title: t("sidebar.feed_actions.edit_feed"),
            content: ({ dismiss }) => <FeedForm id={feedId} onSuccess={dismiss} />,
          })
        },
      }),
      new MenuItemText({
        label: isMultipleSelection
          ? t("sidebar.feed_actions.unfollow_feed_many")
          : isEntryList
            ? t("sidebar.feed_actions.unfollow_feed")
            : t("sidebar.feed_actions.unfollow"),
        shortcut: "$mod+Backspace",
        disabled: isInbox,
        supportMultipleSelection: true,
        click: () => {
          if (isMultipleSelection) {
            presentDeleteSubscription(feedIds)
            return
          }
          deleteSubscription.mutate({ subscription })
        },
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.navigate_to_feed"),
        shortcut: "$mod+G",
        disabled: getRouteParams().feedId === feedId,
        click: () => {
          navigateEntry({ feedId })
        },
      }),
      new MenuItemSeparator(isEntryList),
      new MenuItemText({
        label: t("sidebar.feed_actions.open_feed_in_browser", {
          which: t(IN_ELECTRON ? "words.browser" : "words.newTab"),
        }),
        disabled: isEntryList,
        shortcut: shortcuts[COMMAND_ID.subscription.openInBrowser],
        click: () => window.open(UrlBuilder.shareFeed(feedId, view), "_blank"),
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.open_site_in_browser", {
          which: t(IN_ELECTRON ? "words.browser" : "words.newTab"),
        }),
        shortcut: shortcuts[COMMAND_ID.subscription.openSiteInBrowser],
        disabled: isEntryList,
        click: () => {
          const feed = getFeedById(feedId)
          if (feed) {
            "siteUrl" in feed && feed.siteUrl && window.open(feed.siteUrl, "_blank")
          }
        },
      }),
      new MenuItemSeparator(isEntryList),
      new MenuItemText({
        label: t("sidebar.feed_actions.copy_feed_url"),
        disabled: isEntryList,
        shortcut: "$mod+C",
        click: () => {
          const { url, siteUrl } = feed || {}
          const copied = url || siteUrl
          if (!copied) return
          navigator.clipboard.writeText(copied)
        },
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.copy_feed_id"),
        shortcut: "$mod+Shift+C",
        disabled: isEntryList,
        click: () => {
          navigator.clipboard.writeText(feedId)
        },
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.copy_feed_badge"),
        disabled: isEntryList,
        click: () => {
          navigator.clipboard.writeText(
            `https://badge.follow.is/feed/${feedId}?color=FF5C00&labelColor=black&style=flat-square`,
          )
        },
      }),
    ]

    return items.filter(
      (item) =>
        !isMultipleSelection ||
        (typeof item === "object" &&
          item !== null &&
          "supportMultipleSelection" in item &&
          item.supportMultipleSelection),
    )
  }, [
    addFeedToListMutation,
    addFeedsToCategoryMutation,
    categories,
    claimFeed,
    deleteSubscription,
    feed,
    feedId,
    feedIds,
    inbox,
    isEntryList,
    isInMASReview,
    isInbox,
    isMultipleSelection,
    listByView,
    navigateEntry,
    openBoostModal,
    present,
    presentCategoryCreationModal,
    presentDeleteSubscription,
    removeFeedFromListMutation,
    resetFeed,
    shortcuts,
    subscription,
    subscriptions,
    t,
    view,
  ])

  return items
}

export const useListActions = ({ listId, view }: { listId: string; view?: FeedViewType }) => {
  const { t } = useTranslation()
  const list = useListById(listId)
  const subscription = useSubscriptionByFeedId(listId)!

  const { present } = useModalStack()
  const { mutateAsync: deleteSubscription } = useDeleteSubscription({})

  const shortcuts = useCommandShortcuts()
  const navigateEntry = useNavigateEntry()

  const items = useMemo(() => {
    if (!list) return []

    const items: MenuItemInput[] = [
      ...(list.ownerUserId === whoami()?.id
        ? [
            new MenuItemText({
              label: t("sidebar.feed_actions.list_owned_by_you"),
              disabled: true,
            }),
            MenuItemSeparator.default,
          ]
        : []),

      new MenuItemText({
        label: t("sidebar.feed_actions.mark_all_as_read"),
        shortcut: shortcuts[COMMAND_ID.subscription.markAllAsRead],
        click: () => {
          unreadSyncService.markFeedAsRead(list.feedIds)
        },
      }),
      MenuItemSeparator.default,
      new MenuItemText({
        label: t("sidebar.feed_actions.edit"),
        shortcut: "E",
        click: () => {
          present({
            title: t("sidebar.feed_actions.edit_list"),
            content: ({ dismiss }) => <ListForm id={listId} onSuccess={dismiss} />,
          })
        },
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.unfollow"),
        shortcut: "$mod+Backspace",
        click: () => deleteSubscription({ subscription }),
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.navigate_to_list"),
        shortcut: "$mod+G",
        disabled: getRouteParams().feedId === listId,
        click: () => {
          navigateEntry({ listId })
        },
      }),
      MenuItemSeparator.default,
      new MenuItemText({
        label: t("sidebar.feed_actions.open_list_in_browser", {
          which: t(IN_ELECTRON ? "words.browser" : "words.newTab"),
        }),
        shortcut: shortcuts[COMMAND_ID.subscription.openInBrowser],
        click: () => window.open(UrlBuilder.shareList(listId, view), "_blank"),
      }),
      MenuItemSeparator.default,
      new MenuItemText({
        label: t("sidebar.feed_actions.copy_list_url"),
        shortcut: "$mod+C",
        click: () => {
          navigator.clipboard.writeText(UrlBuilder.shareList(listId, view))
        },
      }),
      new MenuItemText({
        label: t("sidebar.feed_actions.copy_list_id"),
        shortcut: "$mod+Shift+C",
        click: () => {
          navigator.clipboard.writeText(listId)
        },
      }),
    ]

    return items
  }, [list, t, shortcuts, listId, present, deleteSubscription, subscription, navigateEntry, view])

  return items
}

export const useInboxActions = ({ inboxId }: { inboxId: string }) => {
  const { t } = useTranslation()
  const isInbox = useIsInbox(inboxId)
  const { present } = useModalStack()

  const items = useMemo(() => {
    if (!isInbox) return []

    const items: FollowMenuItem[] = [
      new MenuItemText({
        label: t("sidebar.feed_actions.edit"),
        shortcut: "E",
        click: () => {
          present({
            title: t("sidebar.feed_actions.edit_inbox"),
            content: () => <InboxForm asWidget id={inboxId} />,
          })
        },
      }),
      MenuItemSeparator.default,
      new MenuItemText({
        label: t("sidebar.feed_actions.copy_email_address"),
        shortcut: "$mod+Shift+C",
        click: () => {
          navigator.clipboard.writeText(`${inboxId}${env.VITE_INBOXES_EMAIL}`)
        },
      }),
    ]

    return items
  }, [isInbox, t, inboxId, present])

  return { items }
}

export const useAddFeedToFeedList = (options?: {
  onSuccess?: () => void
  onError?: () => void
}) => {
  const { t } = useTranslation("settings")
  return useMutation({
    mutationFn: async (
      payload: { feedId: string; listId: string } | { feedIds: string[]; listId: string },
    ) => {
      await listSyncServices.addFeedsToFeedList(payload)
    },
    onSuccess: () => {
      toast.success(t("lists.feeds.add.success"))

      options?.onSuccess?.()
    },
    async onError() {
      toast.error(t("lists.feeds.add.error"))
      options?.onError?.()
    },
  })
}

export const useRemoveFeedFromFeedList = (options?: {
  onSuccess: () => void
  onError: () => void
}) => {
  const { t } = useTranslation("settings")
  return useMutation({
    mutationFn: async (payload: { feedId: string; listId: string }) => {
      await listSyncServices.removeFeedFromFeedList(payload)
    },
    onSuccess: () => {
      toast.success(t("lists.feeds.delete.success"))
      options?.onSuccess?.()
    },
    async onError() {
      toast.error(t("lists.feeds.delete.error"))
      options?.onError?.()
    },
  })
}
