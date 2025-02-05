import { useActionSheet } from "@expo/react-native-action-sheet"
import { FeedViewType } from "@follow/constants"
import { zodResolver } from "@hookform/resolvers/zod"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { memo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { View } from "react-native"
import { z } from "zod"

import { BlurEffectWithBottomBorder } from "@/src/components/common/BlurEffect"
import {
  ModalHeaderCloseButton,
  ModalHeaderSubmitButton,
} from "@/src/components/common/ModalSharedComponents"
import { SafeModalScrollView } from "@/src/components/common/SafeModalScrollView"
import { FormProvider, useFormContext } from "@/src/components/ui/form/FormProvider"
import { FormLabel } from "@/src/components/ui/form/Label"
import { NumberField, TextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetButtonCell,
  GroupedInsetListCard,
} from "@/src/components/ui/grouped/GroupedList"
import { PowerIcon } from "@/src/icons/power"
import { getBizFetchErrorMessage } from "@/src/lib/api-fetch"
import { toast } from "@/src/lib/toast"
import { FeedViewSelector } from "@/src/modules/feed/view-selector"
import { getList } from "@/src/store/list/getters"
import { useList } from "@/src/store/list/hooks"
import type { ListModel } from "@/src/store/list/store"
import { listSyncServices } from "@/src/store/list/store"
import type { CreateListModel } from "@/src/store/list/types"
import { accentColor } from "@/src/theme/colors"

const listSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  image: z
    .string()
    .url()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val)),

  fee: z.number().min(0),
  view: z.number().int(),
})

const defaultValues = {
  title: "",
  description: null,
  image: null,
  fee: 0,
  view: FeedViewType.Articles,
} as ListModel
export default function ListScreen() {
  const listId = useLocalSearchParams<{ id?: string }>().id

  const list = useList(listId || "")
  const form = useForm({
    defaultValues: list || defaultValues,
    resolver: zodResolver(listSchema),
    mode: "all",
  })
  const isEditing = !!listId
  const { showActionSheetWithOptions } = useActionSheet()

  return (
    <FormProvider form={form}>
      <SafeModalScrollView className="bg-system-grouped-background flex-1 pb-safe">
        <ScreenOptions title={list?.title} listId={listId} />

        <GroupedInsetListCard showSeparator={false} className="mt-6 px-3 py-6">
          <Controller
            name="title"
            control={form.control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, ref, value } }) => (
              <TextField
                label="Title"
                required={true}
                wrapperClassName="mt-2"
                placeholder=""
                onBlur={onBlur}
                onChangeText={onChange}
                defaultValue={list?.title ?? ""}
                value={value ?? ""}
                ref={ref}
              />
            )}
          />

          <View className="mt-4">
            <Controller
              name="description"
              control={form.control}
              render={({ field: { onChange, onBlur, ref, value } }) => (
                <TextField
                  label="Description"
                  wrapperClassName="mt-2"
                  placeholder=""
                  onBlur={onBlur}
                  onChangeText={onChange}
                  defaultValue={list?.description ?? ""}
                  value={value ?? ""}
                  ref={ref}
                />
              )}
            />
          </View>

          <View className="mt-4">
            <Controller
              name="image"
              control={form.control}
              render={({ field: { onChange, onBlur, ref, value } }) => (
                <TextField
                  autoCapitalize="none"
                  label="Image"
                  wrapperClassName="mt-2"
                  placeholder="https://"
                  onBlur={onBlur}
                  onChangeText={(val) => {
                    onChange(val === "" ? null : val)
                  }}
                  defaultValue={list?.image ?? ""}
                  value={value ?? ""}
                  ref={ref}
                />
              )}
            />
          </View>

          <View className="mt-4">
            <FormLabel label="View" className="mb-4 pl-2.5" optional />
            <Controller
              name="view"
              control={form.control}
              render={({ field: { onChange, value } }) => (
                <FeedViewSelector value={value as any as FeedViewType} onChange={onChange} />
              )}
            />
          </View>

          <View className="mt-4">
            <Controller
              name="fee"
              control={form.control}
              render={({ field: { onChange, onBlur, ref, value } }) => (
                <NumberField
                  label="Fee"
                  wrapperClassName="mt-2"
                  placeholder="0"
                  onBlur={onBlur}
                  onChangeNumber={onChange}
                  defaultValue={list?.fee ?? 0}
                  value={value ?? 0}
                  inputPostfixElement={<PowerIcon color={accentColor} />}
                  ref={ref}
                />
              )}
            />
          </View>
        </GroupedInsetListCard>

        {isEditing && (
          <GroupedInsetListCard className="mt-6">
            <GroupedInsetButtonCell
              label="Delete"
              style="destructive"
              onPress={() => {
                showActionSheetWithOptions(
                  {
                    options: ["Delete", "Cancel"],
                    cancelButtonIndex: 1,
                    destructiveButtonIndex: 0,
                  },
                  async (index) => {
                    if (index === 0) {
                      await listSyncServices.deleteList({ listId: listId! })
                      router.dismiss()
                    }
                  },
                )
              }}
            />
          </GroupedInsetListCard>
        )}
      </SafeModalScrollView>
    </FormProvider>
  )
}

interface ScreenOptionsProps {
  title?: string
  listId?: string
}
const ScreenOptions = memo(({ title, listId }: ScreenOptionsProps) => {
  const form = useFormContext()

  const { isValid, isDirty } = form.formState

  const isEditing = !!listId
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Stack.Screen
      options={{
        headerLeft: ModalHeaderCloseButton,
        gestureEnabled: !isDirty,
        headerTransparent: true,
        headerBackground: BlurEffectWithBottomBorder,
        headerRight: () => (
          <FormProvider form={form}>
            <ModalHeaderSubmitButton
              isValid={isValid}
              isLoading={isLoading}
              onPress={form.handleSubmit((values) => {
                if (!isEditing) {
                  setIsLoading(true)
                  listSyncServices
                    .createList({
                      list: values as CreateListModel,
                    })
                    .catch((error) => {
                      toast.error(getBizFetchErrorMessage(error))
                      console.error(error)
                    })
                    .finally(() => {
                      setIsLoading(false)
                      router.dismiss()
                    })
                  return
                }
                const list = getList(listId!)
                if (!list) return
                setIsLoading(true)
                listSyncServices
                  .updateList({
                    listId: listId!,
                    list: {
                      ...list,
                      ...values,
                    },
                  })
                  .catch((error) => {
                    toast.error(getBizFetchErrorMessage(error))
                    console.error(error)
                  })
                  .finally(() => {
                    setIsLoading(false)
                    router.dismiss()
                  })
              })}
            />
          </FormProvider>
        ),

        headerTitle: title ? `Edit List - ${title}` : "Create List",
      }}
    />
  )
})
