import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardHeader } from "@follow/components/ui/card/index.jsx"
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
import type { EntryModelSimple, FeedModel } from "@follow/models/types"
import { tracker } from "@follow/tracker"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { Autocomplete } from "~/components/ui/auto-completion"
import { useCurrentModal, useIsInModal } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery, useI18n } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { tipcClient } from "~/lib/client"
import { getFetchErrorMessage, toastFetchError } from "~/lib/error-parser"
import { getNewIssueUrl } from "~/lib/issues"
import { FollowSummary } from "~/modules/feed/feed-summary"
import { feed as feedQuery, useFeed } from "~/queries/feed"
import { subscription as subscriptionQuery } from "~/queries/subscriptions"
import { useFeedByIdOrUrl } from "~/store/feed"
import { useSubscriptionByFeedId } from "~/store/subscription"
import { feedUnreadActions } from "~/store/unread"

import { ViewSelectorRadioGroup } from "../shared/ViewSelectorRadioGroup"

const formSchema = z.object({
  view: z.string(),
  category: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  title: z.string().optional(),
})
export type FeedFormDataValuesType = z.infer<typeof formSchema>

const defaultValue = { view: FeedViewType.Articles.toString() } as FeedFormDataValuesType

export const FeedForm: Component<{
  url?: string
  id?: string
  defaultValues?: FeedFormDataValuesType

  onSuccess?: () => void
}> = ({ id: _id, defaultValues = defaultValue, url, onSuccess }) => {
  const queryParams = { id: _id, url }

  const feedQuery = useFeed(queryParams)

  const id = feedQuery.data?.feed.id || _id
  const feed = useFeedByIdOrUrl({
    id,
    url,
  }) as FeedModel

  const { t } = useTranslation()

  const isInModal = useIsInModal()
  const rootContainerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="flex flex-col" ref={rootContainerRef}>
      <ScrollArea.ScrollArea
        rootClassName={cn(
          "flex h-full max-h-[calc(100vh-300px)] flex-col",
          "mx-auto min-h-[420px] w-full max-w-[550px] lg:min-w-[550px]",
          isInModal && "-mx-4 px-4",
        )}
      >
        {feed ? (
          <FeedInnerForm
            {...{
              defaultValues,
              id,
              url,

              onSuccess,
              subscriptionData: feedQuery.data?.subscription,
              entries: feedQuery.data?.entries,
              feed,
              rootContainerRef,
            }}
          />
        ) : feedQuery.isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingCircle size="large" />
          </div>
        ) : feedQuery.error ? (
          <div className="center grow flex-col gap-3">
            <i className="i-mgc-close-cute-re text-red size-7" />
            <p>{t("feed_form.error_fetching_feed")}</p>
            <p className="cursor-text select-text break-all px-8 text-center">
              {getFetchErrorMessage(feedQuery.error)}
            </p>

            <div className="flex items-center gap-4">
              <Button
                variant="text"
                onClick={() => {
                  feedQuery.refetch()
                }}
              >
                {t("feed_form.retry")}
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  window.open(
                    getNewIssueUrl({
                      body: [
                        "### Info:",
                        "",
                        "Feed URL:",
                        "```",
                        url,
                        "```",
                        "",
                        "Error:",
                        "```",
                        getFetchErrorMessage(feedQuery.error),
                        "```",
                      ].join("\n"),
                      title: `Error in fetching feed: ${id ?? url}`,
                      target: "discussion",
                      category: "feed-expired",
                    }),
                    "_blank",
                  )
                }}
              >
                {t("feed_form.feedback")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="center h-full grow flex-col">
            <i className="i-mgc-question-cute-re mb-6 size-12 text-zinc-500" />
            <p>{t("feed_form.feed_not_found")}</p>
            <p>{url}</p>
          </div>
        )}
      </ScrollArea.ScrollArea>
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

  rootContainerRef,
}: {
  defaultValues?: z.infer<typeof formSchema>
  id?: string

  onSuccess?: () => void
  subscriptionData?: {
    view?: number
    category?: string | null
    isPrivate?: boolean
    title?: string | null
  }
  feed: FeedModel
  entries?: EntryModelSimple[]

  rootContainerRef: React.RefObject<HTMLDivElement>
}) => {
  const subscription = useSubscriptionByFeedId(id || "") || subscriptionData
  const isSubscribed = !!subscription

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const { setClickOutSideToDismiss, dismiss } = useCurrentModal()

  useEffect(() => {
    setClickOutSideToDismiss(!form.formState.isDirty)
  }, [form.formState.isDirty])

  useEffect(() => {
    if (subscription) {
      form.setValue("view", `${subscription?.view}`)
      subscription?.category && form.setValue("category", subscription.category)
      form.setValue("isPrivate", subscription?.isPrivate || false)
      form.setValue("title", subscription?.title || "")
    }
  }, [subscription])

  const followMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const body = {
        url: feed.url,
        view: Number.parseInt(values.view),
        category: values.category,
        isPrivate: values.isPrivate,
        title: values.title,
        feedId: feed.id,
      }
      const $method = isSubscribed ? apiClient.subscriptions.$patch : apiClient.subscriptions.$post

      return $method({
        json: body,
      })
    },
    onSuccess: (_, variables) => {
      if (isSubscribed && variables.view !== `${subscription?.view}`) {
        feedUnreadActions.fetchUnreadByView(subscription?.view)
      } else {
        feedUnreadActions.fetchUnreadByView(Number.parseInt(variables.view))
      }
      subscriptionQuery.all().invalidate()
      tipcClient?.invalidateQuery(subscriptionQuery.all().key)

      const feedId = feed.id
      if (feedId) {
        feedQuery.byId({ id: feedId }).invalidate()
        tipcClient?.invalidateQuery(feedQuery.byId({ id: feedId }).key)
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

  const categories = useAuthQuery(subscriptionQuery.categories())

  const suggestions = useMemo(
    () =>
      (
        categories.data?.map((i) => ({
          name: i,
          value: i,
        })) || []
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [categories.data],
  )

  const fillDefaultTitle = useCallback(() => {
    form.setValue("title", feed.title || "")
  }, [feed.title, form])

  return (
    <div className="flex flex-1 flex-col gap-y-4">
      <Card>
        <CardHeader>
          <FollowSummary feed={feed} />
        </CardHeader>
      </Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-y-4">
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
            name="view"
            render={() => (
              <FormItem className="mb-16">
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
          <RootPortal to={rootContainerRef.current}>
            <div className="flex items-center justify-end gap-4 px-4 pt-2">
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
              <Button type="submit" isLoading={followMutation.isPending}>
                {isSubscribed ? t("feed_form.update") : t("feed_form.follow")}
              </Button>
            </div>
          </RootPortal>
        </form>
      </Form>
    </div>
  )
}
