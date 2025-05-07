import { FeedViewType } from "@follow/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { z } from "zod"

import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { FormProvider } from "@/src/components/ui/form/FormProvider"
import { FormLabel } from "@/src/components/ui/form/Label"
import { FormSwitch } from "@/src/components/ui/form/Switch"
import { TextField } from "@/src/components/ui/form/TextField"
import { GroupedInsetListCard } from "@/src/components/ui/grouped/GroupedList"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { useCanDismiss, useNavigation } from "@/src/lib/navigation/hooks"
import { useSetModalScreenOptions } from "@/src/lib/navigation/ScreenOptionsContext"
import { FeedViewSelector } from "@/src/modules/feed/view-selector"
import { useFeed, usePrefetchFeed, usePrefetchFeedByUrl } from "@/src/store/feed/hooks"
import { useSubscriptionByFeedId } from "@/src/store/subscription/hooks"
import { subscriptionSyncService } from "@/src/store/subscription/store"
import type { SubscriptionForm } from "@/src/store/subscription/types"

const formSchema = z.object({
  view: z.coerce.number(),
  category: z.string().nullable().optional(),
  isPrivate: z.boolean().optional(),
  title: z.string().optional(),
})

export function FollowFeed(props: { id: string }) {
  const { id } = props
  const feed = useFeed(id as string)
  const { isLoading } = usePrefetchFeed(id as string, { enabled: !feed })

  if (isLoading) {
    return (
      <View className="mt-24 flex-1 flex-row items-start justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }

  return <FollowImpl feedId={id} />
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

  return <FollowImpl feedId={data.id} />
}

function FollowImpl(props: { feedId: string }) {
  const { feedId: id } = props

  const feed = useFeed(id)
  const subscription = useSubscriptionByFeedId(feed?.id)
  const isSubscribed = !!subscription

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: subscription?.category ?? "",
      isPrivate: subscription?.isPrivate ?? false,
      title: subscription?.title ?? "",
      view: subscription?.view ?? FeedViewType.Articles,
    },
  })

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
      title: values.title ?? "",
      feedId: feed?.id,
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
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      Header={
        <NavigationBlurEffectHeaderView
          title={`${isSubscribed ? "Edit" : "Follow"} - ${feed?.title}`}
          headerRight={
            <HeaderSubmitTextButton
              isValid={isValid}
              onPress={form.handleSubmit(submit)}
              isLoading={isLoading}
              label={isSubscribed ? "Save" : "Follow"}
            />
          }
        />
      }
    >
      {/* Group 1 */}
      <GroupedInsetListCard className="px-5 py-4">
        <View className="flex flex-row gap-4">
          <View className="size-[50px] overflow-hidden rounded-lg">
            <FeedIcon feed={feed} size={50} />
          </View>
          <View className="flex-1 flex-col gap-y-1">
            <Text className="text-text text-lg font-semibold">{feed?.title}</Text>
            <Text className="text-secondary-label text-sm">{feed?.description}</Text>
          </View>
        </View>
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
                  label="Title"
                  description="Custom title for this Feed. Leave empty to use the default."
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
                  label="Category"
                  description="By default, your follows will be grouped by website."
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
                  label="Private"
                  description="Private feeds are only visible to you."
                  onValueChange={onChange}
                />
              )}
            />
          </View>

          <View className="-mx-4">
            <FormLabel className="mb-4 pl-5" label="View" optional />

            <Controller
              name="view"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FeedViewSelector value={value as any as FeedViewType} onChange={onChange} />
              )}
            />
          </View>
        </FormProvider>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
