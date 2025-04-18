import { FeedViewType } from "@follow/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
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
import { apiClient } from "@/src/lib/api-fetch"
import { useNavigation, useScreenIsInSheetModal } from "@/src/lib/navigation/hooks"
import { useSetModalScreenOptions } from "@/src/lib/navigation/ScreenOptionsContext"
import { toast } from "@/src/lib/toast"
import { useList } from "@/src/store/list/hooks"
import { listSyncServices } from "@/src/store/list/store"
import { useSubscriptionByListId } from "@/src/store/subscription/hooks"
import { accentColor } from "@/src/theme/colors"

import { FeedViewSelector } from "../feed/view-selector"

export const FollowList = (props: { id: string }) => {
  const { id } = props
  const list = useList(id as string)
  const { isLoading } = useQuery({
    queryKey: ["list", id],
    queryFn: () => listSyncServices.fetchListById({ id: id as string }),
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
  view: z.string(),
  isPrivate: z.boolean().optional(),
  title: z.string().optional(),
})
const defaultValues = { view: FeedViewType.Articles.toString() }

const Impl = (props: { id: string }) => {
  const { id } = props
  const list = useList(id as string)!

  const isSubscribed = useSubscriptionByListId(id as string)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })
  const { isValid, isDirty } = form.formState

  const isModal = useScreenIsInSheetModal()
  const navigation = useNavigation()
  const submit = async () => {
    const payload = form.getValues()

    const subscribeOrUpdate = async () => {
      const body = {
        listId: list.id,
        view: list.view,

        isPrivate: payload.isPrivate,
        title: payload.title,
      }
      const $method = isSubscribed ? apiClient.subscriptions.$patch : apiClient.subscriptions.$post

      await $method({
        json: body,
      })
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
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentViewClassName="gap-y-4 mt-2"
      Header={
        <NavigationBlurEffectHeaderView
          title={`${isSubscribed ? "Edit" : "Follow"} - ${list?.title}`}
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
            <FormLabel className="mb-4 pl-5" label="View" optional />

            <FeedViewSelector readOnly value={list.view} />
          </View>

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
              name="isPrivate"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FormSwitch
                  value={value}
                  label="Private"
                  description="Private feeds are only visible to you."
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
