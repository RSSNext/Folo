import { FeedViewType } from "@follow/constants"
import { useList } from "@follow/store/list/hooks"
import { listSyncServices } from "@follow/store/list/store"
import { useSubscriptionByListId } from "@follow/store/subscription/hooks"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Alert, StyleSheet, Text, View } from "react-native"
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
import { IconWithFallback } from "@/src/components/ui/icon/fallback-icon"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { PowerIcon } from "@/src/icons/power"
import { useNavigation, useScreenIsInSheetModal } from "@/src/lib/navigation/hooks"
import { useSetModalScreenOptions } from "@/src/lib/navigation/ScreenOptionsContext"
import { toast } from "@/src/lib/toast"
import { accentColor } from "@/src/theme/colors"

import { FeedViewSelector } from "../feed/view-selector"

export const FollowList = (props: { id: string }) => {
  const { id } = props
  const list = useList(id)
  const { isLoading } = useQuery({
    queryKey: ["list", id],
    queryFn: () => listSyncServices.fetchListById({ id }),
    enabled: !list,
  })

  if (isLoading) {
    return (
      <View className="mt-24 flex-1 flex-row items-start justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }

  return <Impl id={id} />
}

const formSchema = z.object({
  view: z.number(),
  isPrivate: z.boolean().default(false),
  title: z.string().optional(),
})

const Impl = (props: { id: string }) => {
  const { t } = useTranslation()
  const { t: tCommon } = useTranslation("common")
  const { id } = props
  const list = useList(id)

  const subscription = useSubscriptionByListId(id)
  const isSubscribed = !!subscription

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      view: list?.view ?? FeedViewType.Articles,
      isPrivate: subscription?.isPrivate,
      title: subscription?.title ?? undefined,
    },
  })
  const { isValid, isDirty } = form.formState

  const isModal = useScreenIsInSheetModal()
  const navigation = useNavigation()
  const submit = async () => {
    if (!list) return
    const payload = form.getValues()

    const subscribeOrUpdate = async () => {
      const body = {
        listId: list.id,
        view: list.view,

        isPrivate: payload.isPrivate,
        title: payload.title,
      }

      if (isSubscribed) {
        await subscriptionSyncService.edit({
          ...subscription,
          ...body,
        })
      } else {
        await subscriptionSyncService.subscribe(body)
      }

      if (isModal) {
        navigation.dismiss()
      } else {
        navigation.back()
      }
      toast.success(isSubscribed ? "List updated" : "List followed")
    }
    if (list.fee && !isSubscribed) {
      Alert.alert(
        `Follow List - ${list.title}`,
        `To follow this list, you must pay a fee to the list creator. Press OK to pay ${list.fee} power to follow this list.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: () => {
              subscribeOrUpdate()
            },
            isPreferred: true,
          },
        ],
      )
    } else {
      subscribeOrUpdate()
    }
  }

  const isLoading = false

  const setModalOptions = useSetModalScreenOptions()
  useEffect(() => {
    setModalOptions({
      gestureEnabled: !isDirty,
    })
  }, [isDirty, setModalOptions])

  if (!list) {
    return null
  }

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentViewClassName="gap-y-4 mt-2"
      Header={
        <NavigationBlurEffectHeaderView
          title={`${isSubscribed ? tCommon("words.edit") : tCommon("words.follow")} - ${list?.title}`}
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
      <GroupedInsetListCard className="px-5 py-4">
        <View className="flex flex-row gap-4">
          <View className="size-[50px] overflow-hidden rounded-lg">
            <IconWithFallback
              url={list?.image}
              title={list?.title}
              size={50}
              textClassName="font-semibold"
              textStyle={styles.title}
            />
          </View>
          <View className="flex-1 flex-col gap-y-1">
            <Text className="text-text text-lg font-semibold">{list?.title}</Text>
            <Text className="text-secondary-label text-sm">{list?.description}</Text>
          </View>
        </View>
      </GroupedInsetListCard>

      <GroupedInsetListCard className="gap-y-6 px-5 py-4">
        <FormProvider form={form}>
          <View className="-mx-4">
            <FormLabel className="mb-4 pl-4" label={t("subscription_form.view")} optional />

            <FeedViewSelector readOnly value={list.view} />
          </View>

          <View className="-mx-2.5">
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
                  wrapperClassName="ml-2.5"
                />
              )}
            />
          </View>

          <View className="-mx-1">
            <Controller
              name="isPrivate"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FormSwitch
                  value={value}
                  label={t("subscription_form.private_follow")}
                  description={t("subscription_form.private_follow_description")}
                  onValueChange={onChange}
                  size="sm"
                />
              )}
            />
          </View>

          {!!list.fee && (
            <View className="ml-1">
              <View className="flex-row">
                <FormLabel label="Follow fee" optional />
                <View className="ml-1 flex-row items-center gap-x-0.5">
                  <PowerIcon height={14} width={14} color={accentColor} />
                  <Text className="text-label text-sm font-semibold">{list.fee}</Text>
                </View>
              </View>
              <Text className="text-secondary-label text-sm">
                To follow this list, you must pay a fee to the list creator.
              </Text>
            </View>
          )}
        </FormProvider>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
  },
})
