import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import { FeedViewType } from "@follow/constants"
import type { EntryModelSimple, FeedAnalyticsModel, FeedModel } from "@follow/models/types"
import { invalidateEntriesQuery } from "@follow/store/entry/hooks"
import { useFeedByIdOrUrl } from "@follow/store/feed/hooks"
import { useCategories, useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { unreadActions } from "@follow/store/unread/store"
import { tracker } from "@follow/tracker"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { getGeneralSettings } from "~/atoms/settings/general"
import { Autocomplete } from "~/components/ui/auto-completion"
import { useCurrentModal, useIsInModal } from "~/components/ui/modal/stacked/hooks"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { useI18n } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { toastFetchError } from "~/lib/error-parser"
import { feed as feedQuery, useFeedQuery } from "~/queries/feed"

import { ViewSelectorRadioGroup } from "../shared/ViewSelectorRadioGroup"
import { FeedSummary } from "./FeedSummary"

const formSchema = z.object({
  view: z.string(),
  category: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  hideFromTimeline: z.boolean().optional(),
  title: z.string().optional(),
})
export type FeedFormDataValuesType = z.infer<typeof formSchema>

export const FeedForm: Component<{
  url?: string
  id?: string
  defaultValues?: FeedFormDataValuesType

  onSuccess?: () => void
}> = ({ id: _id, defaultValues, url, onSuccess }) => {
  const queryParams = { id: _id, url }

  const feedQuery = useFeedQuery(queryParams)

  const id = feedQuery.data?.feed.id || _id
  const feed = useFeedByIdOrUrl({
    id,
    url,
  }) as FeedModel

  const { t } = useTranslation()

  const isInModal = useIsInModal()
  const placeholderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!feedQuery.isLoading) {
      tracker.subscribeModalOpened({
        feedId: id,
        feedUrl: feedQuery.data?.feed.url || url,
        isError: feedQuery.isError,
      })
    }
  }, [feedQuery.isLoading])

  return (
    <div
      className={cn(
        "flex h-full max-h-[calc(100vh-300px)] flex-col",
        "mx-auto min-h-[420px] w-full max-w-[550px] lg:min-w-[550px]",
      )}
    >
      {useMemo(() => {
        switch (true) {
          case !!feed: {
            return (
              <ScrollArea.ScrollArea
                flex
                rootClassName={cn(isInModal && "-mx-4 px-4 -mt-4", "h-[500px] grow")}
                viewportClassName="pt-4"
              >
                {/* // Workaround for the issue with the scroll area viewport setting the display to
                table // Learn more about the issue here: //
                https://github.com/radix-ui/primitives/issues/926
                https://github.com/radix-ui/primitives/issues/3129
                https://github.com/radix-ui/primitives/pull/3225 */}
                <div className="flex">
                  <div className="w-0 grow truncate">
                    <FeedInnerForm
                      {...{
                        defaultValues,
                        id,
                        url,

                        onSuccess,
                        isLoading: feedQuery.isLoading,
                        subscriptionData: feedQuery.data?.subscription,
                        entries: feedQuery.data?.entries,
                        feed,
                        analytics: feedQuery.data?.analytics,
                        placeholderRef,
                      }}
                    />
                  </div>
                </div>
              </ScrollArea.ScrollArea>
            )
          }
          case feedQuery.isLoading: {
            return (
              <div className="flex flex-1 items-center justify-center">
                <LoadingCircle size="large" />
              </div>
            )
          }
          case !!feedQuery.error: {
            return (
              <div className="center grow flex-col gap-3">
                <i className="i-mgc-close-cute-re text-red size-7" />
                <p>{t("feed_form.error_fetching_feed")}</p>
              </div>
            )
          }
          default: {
            return (
              <div className="center h-full grow flex-col">
                <i className="i-mgc-question-cute-re mb-6 size-12 text-zinc-500" />
                <p>{t("feed_form.feed_not_found")}</p>
              </div>
            )
          }
        }
      }, [
        defaultValues,
        feed,
        feedQuery.data?.entries,
        feedQuery.data?.subscription,
        feedQuery.error,
        feedQuery.isLoading,
        id,
        isInModal,
        onSuccess,
        t,
        url,
      ])}
      <div ref={placeholderRef} />
    </div>
  )
}

const FeedInnerForm = ({
  defaultValues,
  id,

  onSuccess,
  subscriptionData,
  feed,
  entries,
  analytics,

  placeholderRef,
  isLoading,
}: {
  defaultValues?: z.infer<typeof formSchema>
  id?: string

  onSuccess?: () => void
  subscriptionData?: {
    view?: number
    category?: string | null
    isPrivate?: boolean
    title?: string | null
    hideFromTimeline?: boolean | null
  }
  feed: FeedModel
  entries?: EntryModelSimple[]
  analytics?: FeedAnalyticsModel

  placeholderRef: React.RefObject<HTMLDivElement | null>
  isLoading: boolean
}) => {
  const subscription = useSubscriptionByFeedId(id || "") || subscriptionData
  const isSubscribed = !!subscription

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      view: getRouteParams().view.toString() || FeedViewType.Articles.toString(),
    },
  })

  const { setClickOutSideToDismiss, dismiss } = useCurrentModal()

  useEffect(() => {
    setClickOutSideToDismiss(!form.formState.isDirty)
  }, [form.formState.isDirty])

  useEffect(() => {
    if (subscription) {
      form.setValue("view", `${subscription?.view}`)
      subscription?.category && form.setValue("category", subscription.category)
      typeof subscription.isPrivate === "boolean" &&
        form.setValue("isPrivate", subscription.isPrivate)
      typeof subscription.hideFromTimeline === "boolean" &&
        form.setValue("hideFromTimeline", subscription.hideFromTimeline)
      subscription?.title && form.setValue("title", subscription.title)
    }
  }, [subscription])

  useEffect(() => {
    if (
      typeof analytics?.view === "number" &&
      !subscription &&
      typeof defaultValues?.view !== "number"
    ) {
      form.setValue("view", `${analytics.view}`)
    }
  }, [analytics, subscription, defaultValues?.view])

  const followMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const body = {
        url: feed.url,
        view: Number.parseInt(values.view),
        category: values.category,
        isPrivate: values.isPrivate,
        hideFromTimeline: values.hideFromTimeline,
        title: values.title,
        feedId: feed.id,
      }
      const $method = isSubscribed ? apiClient.subscriptions.$patch : apiClient.subscriptions.$post

      return $method({
        json: body,
      }) as unknown as Promise<
        | ReturnType<typeof apiClient.subscriptions.$post>
        | ReturnType<typeof apiClient.subscriptions.$patch>
      >
    },
    onSuccess: (data, variables) => {
      if (getGeneralSettings().hidePrivateSubscriptionsInTimeline) {
        invalidateEntriesQuery({ views: [Number(variables.view)] })
      }

      if ("unread" in data) {
        unreadActions.upsertMany(data.unread)
      }
      subscriptionSyncService.fetch()

      const feedId = feed.id
      if (feedId) {
        feedQuery.byId({ id: feedId }).invalidate()
      }
      toast(isSubscribed ? t("feed_form.updated") : t("feed_form.followed"), {
        duration: 1000,
      })

      if (!isSubscribed) {
        tracker.subscribe({ feedId: feed.id, view: Number.parseInt(variables.view) })
      }

      onSuccess?.()
    },
    onError(err) {
      toastFetchError(err)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    followMutation.mutate(values)
  }

  const t = useI18n()

  const categories = useCategories()

  const suggestions = useMemo(
    () =>
      (
        categories?.map((i) => ({
          name: i,
          value: i,
        })) || []
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  )

  const fillDefaultTitle = useCallback(() => {
    form.setValue("title", feed.title || "")
  }, [feed.title, form])

  return (
    <div className="flex flex-1 flex-col gap-y-4">
      <FeedSummary isLoading={isLoading} feed={feed} analytics={analytics} showAnalytics />
      <Form {...form}>
        <form
          id="feed-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-y-4 px-1"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <div>
                  <FormLabel>{t("feed_form.title")}</FormLabel>
                  <FormDescription>{t("feed_form.title_description")}</FormDescription>
                </div>
                <FormControl>
                  <div className="flex gap-2">
                    <Input {...field} />
                    <Button
                      buttonClassName="shrink-0"
                      type="button"
                      variant="outline"
                      onClick={fillDefaultTitle}
                      disabled={field.value === feed.title}
                    >
                      {t("feed_form.fill_default")}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <div>
                  <FormLabel>{t("feed_form.category")}</FormLabel>
                  <FormDescription>{t("feed_form.category_description")}</FormDescription>
                </div>
                <FormControl>
                  <div>
                    <Autocomplete
                      maxHeight={window.innerHeight < 600 ? 120 : 240}
                      suggestions={suggestions}
                      {...(field as any)}
                      onSuggestionSelected={(suggestion) => {
                        if (suggestion) {
                          field.onChange(suggestion.value)
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isPrivate"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>{t("feed_form.private_follow")}</FormLabel>
                    <FormDescription>{t("feed_form.private_follow_description")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      className="shrink-0"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hideFromTimeline"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <div>
                    <FormLabel>{t("feed_form.hide_from_timeline")}</FormLabel>
                    <FormDescription>
                      {t("feed_form.hide_from_timeline_description")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      className="shrink-0"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="view"
            render={() => (
              <FormItem className="mb-4">
                <FormLabel>{t("feed_form.view")}</FormLabel>

                <ViewSelectorRadioGroup
                  {...form.register("view")}
                  entries={entries}
                  feed={feed}
                  view={Number(form.getValues("view"))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      <RootPortal to={placeholderRef.current}>
        <div className="flex items-center justify-end gap-4 pt-2">
          {isSubscribed && (
            <Button
              type="button"
              variant="text"
              onClick={() => {
                dismiss()
              }}
            >
              {t.common("words.cancel")}
            </Button>
          )}
          <Button form="feed-form" type="submit" isLoading={followMutation.isPending}>
            {isSubscribed ? t("feed_form.update") : t("feed_form.follow")}
          </Button>
        </div>
      </RootPortal>
    </div>
  )
}
