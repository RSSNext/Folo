import { FeedViewType } from "@follow/constants"
import { useFeedById, usePrefetchFeed, usePrefetchFeedByUrl } from "@follow/store/feed/hooks"
import { useSubscriptionByFeedId } from "@follow/store/subscription/hooks"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import type { SubscriptionForm } from "@follow/store/subscription/types"
import { formatNumber } from "@follow/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { z } from "zod"

import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FormProvider } from "@/src/components/ui/form/FormProvider"
import { FormLabel } from "@/src/components/ui/form/Label"
import { FormSwitch } from "@/src/components/ui/form/Switch"
import { TextField } from "@/src/components/ui/form/TextField"
import { GroupedInsetListCard } from "@/src/components/ui/grouped/GroupedList"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { SafeAlertCuteReIcon } from "@/src/icons/safe_alert_cute_re"
import { SafetyCertificateCuteReIcon } from "@/src/icons/safety_certificate_cute_re"
import { User3CuteReIcon } from "@/src/icons/user_3_cute_re"
import { useCanDismiss, useNavigation } from "@/src/lib/navigation/hooks"
import { useSetModalScreenOptions } from "@/src/lib/navigation/ScreenOptionsContext"
import { FeedSummary } from "@/src/modules/discover/FeedSummary"
import { FeedViewSelector } from "@/src/modules/feed/view-selector"
import { useColor } from "@/src/theme/colors"

const formSchema = z.object({
  view: z.coerce.number(),
  category: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  hideFromTimeline: z.boolean().optional(),
  title: z.string().optional(),
})
export function FollowFeed(props: { id: string }) {
  const { id } = props
  const feed = useFeedById(id as string)
  const { data } = usePrefetchFeed(id as string)
  if (!feed) {
    return (
      <View className="mt-24 flex-1 flex-row items-start justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }
  return <FollowImpl feedId={id} defaultView={data?.analytics?.view ?? undefined} />
}
export function FollowUrl(props: { url: string }) {
  const { url } = props
  const { isLoading, data, error } = usePrefetchFeedByUrl(url)
  if (isLoading) {
    return (
      <View className="mt-24 flex-1 flex-row items-start justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }
  if (!data) {
    return <Text className="text-label">{error?.message}</Text>
  }
  return (
    <FollowImpl
      feedId={data.feed.id}
      defaultView={data.responseData?.analytics?.view ?? undefined}
    />
  )
}
function FollowImpl(props: { feedId: string; defaultView?: FeedViewType }) {
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation("common")
  const textLabelColor = useColor("label")
  const { feedId: id, defaultView = FeedViewType.Articles } = props
  const feed = useFeedById(id)
  const subscription = useSubscriptionByFeedId(feed?.id)
  const isSubscribed = !!subscription
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: subscription?.category ?? undefined,
      isPrivate: subscription?.isPrivate ?? undefined,
      hideFromTimeline: subscription?.hideFromTimeline ?? undefined,
      title: subscription?.title ?? undefined,
      view: subscription?.view ?? defaultView,
    },
  })
  useEffect(() => {
    form.reset(
      {
        view: subscription?.view ?? defaultView,
      },
      {
        keepDirtyValues: true,
      },
    )
  }, [defaultView, form, subscription?.view])
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigation()
  const canDismiss = useCanDismiss()
  const submit = async () => {
    setIsLoading(true)
    const values = form.getValues()
    const body: SubscriptionForm = {
      url: feed?.url,
      view: values.view,
      category: values.category ?? "",
      isPrivate: values.isPrivate ?? false,
      hideFromTimeline: values.hideFromTimeline,
      title: values.title ?? "",
      feedId: feed?.id,
      listId: undefined,
    }
    if (isSubscribed) {
      await subscriptionSyncService
        .edit({
          ...subscription,
          ...body,
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      await subscriptionSyncService.subscribe(body).finally(() => {
        setIsLoading(false)
      })
    }
    if (canDismiss) {
      navigate.dismiss()
    } else {
      navigate.back()
    }
  }
  const insets = useSafeAreaInsets()
  const { isValid, isDirty } = form.formState
  const setScreenOptions = useSetModalScreenOptions()
  useEffect(() => {
    setScreenOptions({
      preventNativeDismiss: isDirty,
    })
  }, [isDirty, setScreenOptions])
  if (!feed?.id) {
    return <Text className="text-label">Feed ({id}) not found</Text>
  }
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentViewClassName="gap-y-4 mt-2"
      contentContainerStyle={{
        paddingBottom: insets.bottom,
      }}
      Header={
        <NavigationBlurEffectHeaderView
          title={`${isSubscribed ? tCommon("words.edit") : tCommon("words.follow")} - ${feed?.title}`}
          headerRight={
            <HeaderSubmitTextButton
              isValid={isValid}
              onPress={form.handleSubmit(submit)}
              isLoading={isLoading}
              label={isSubscribed ? tCommon("words.save") : tCommon("words.follow")}
            />
          }
        />
      }
    >
      {/* Group 1 */}
      <GroupedInsetListCard>
        <FeedSummary
          className="px-5 py-4"
          item={{
            feed: {
              ...feed,
              type: "feed",
            },
          }}
        >
          <View className="ml-11 mt-2 flex-row items-center gap-3 opacity-60">
            <View className="flex-row items-center gap-1">
              <User3CuteReIcon color={textLabelColor} width={12} height={12} />
              <Text className="text-text text-sm">
                {typeof feed.subscriptionCount === "number" ? (
                  formatNumber(feed.subscriptionCount || 0)
                ) : (
                  <>?</>
                )}{" "}
                {tCommon("feed.follower", {
                  count: feed.subscriptionCount ?? 0,
                })}
              </Text>
            </View>
            {feed.updatesPerWeek ? (
              <View className="flex-row items-center gap-1">
                <SafetyCertificateCuteReIcon color={textLabelColor} width={12} height={12} />
                <Text className="text-text text-sm">
                  {tCommon("feed.entry_week", {
                    count: feed.updatesPerWeek,
                  })}
                </Text>
              </View>
            ) : feed.latestEntryPublishedAt ? (
              <View className="flex-row items-center gap-1">
                <SafeAlertCuteReIcon color={textLabelColor} width={12} height={12} />
                <Text className="text-text text-sm">
                  {tCommon("feed.updated_at")}
                  <RelativeDateTime date={feed.latestEntryPublishedAt} />
                </Text>
              </View>
            ) : null}
          </View>
        </FeedSummary>
      </GroupedInsetListCard>
      {/* Group 2 */}
      <GroupedInsetListCard className="gap-y-4 p-4">
        <FormProvider form={form}>
          <View>
            <Controller
              name="title"
              control={form.control}
              render={({ field: { onChange, ref, value } }) => (
                <TextField
                  label={t("subscription_form.title")}
                  description={t("subscription_form.title_description")}
                  onChangeText={onChange}
                  value={value}
                  ref={ref}
                />
              )}
            />
          </View>

          <View>
            <Controller
              name="category"
              control={form.control}
              render={({ field: { onChange, ref, value } }) => (
                <TextField
                  label={t("subscription_form.category")}
                  description={t("subscription_form.category_description")}
                  onChangeText={onChange}
                  value={value || ""}
                  ref={ref}
                />
              )}
            />
          </View>

          <View>
            <Controller
              name="isPrivate"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FormSwitch
                  size="sm"
                  value={value}
                  label={t("subscription_form.private_follow")}
                  description={t("subscription_form.private_follow_description")}
                  onValueChange={onChange}
                />
              )}
            />
          </View>

          <View>
            <Controller
              name="hideFromTimeline"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FormSwitch
                  size="sm"
                  value={value}
                  label={t("subscription_form.hide_from_timeline")}
                  description={t("subscription_form.hide_from_timeline_description")}
                  onValueChange={onChange}
                />
              )}
            />
          </View>

          <View className="-mx-3">
            <FormLabel className="mb-4 pl-4" label={t("subscription_form.view")} optional />

            <Controller
              name="view"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FeedViewSelector value={value} onChange={onChange} />
              )}
            />
          </View>
        </FormProvider>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
