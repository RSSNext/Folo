import { useActionSheet } from "@expo/react-native-action-sheet"
import { FeedViewType } from "@follow/constants"
import { getList } from "@follow/store/list/getters"
import { useList } from "@follow/store/list/hooks"
import type { ListModel } from "@follow/store/list/store"
import { listSyncServices } from "@follow/store/list/store"
import type { CreateListModel } from "@follow/store/list/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { memo, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { z } from "zod"

import { HeaderSubmitButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { FormProvider, useFormContext } from "@/src/components/ui/form/FormProvider"
import { FormLabel } from "@/src/components/ui/form/Label"
import { NumberField, TextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetButtonCell,
  GroupedInsetListCard,
} from "@/src/components/ui/grouped/GroupedList"
import { PowerIcon } from "@/src/icons/power"
import { getBizFetchErrorMessage } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useSetModalScreenOptions } from "@/src/lib/navigation/ScreenOptionsContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { FeedViewSelector } from "@/src/modules/feed/view-selector"
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

  fee: z.number().min(0).nullable().optional(),
  view: z.number().int(),
})

const defaultValues = {
  title: "",
  description: null,
  image: null,
  fee: 0,
  view: FeedViewType.Articles,
} as ListModel
export const ListScreen: NavigationControllerView<{
  listId?: string
}> = ({ listId }) => {
  const { t } = useTranslation("settings")
  const list = useList(listId || "")
  const form = useForm({
    defaultValues: list || defaultValues,
    resolver: zodResolver(listSchema),
    mode: "all",
  })
  const isEditing = !!listId
  const { showActionSheetWithOptions } = useActionSheet()
  const navigation = useNavigation()
  return (
    <FormProvider form={form}>
      <SafeNavigationScrollView className="bg-system-grouped-background pb-safe flex-1">
        <ScreenOptions title={list?.title} listId={listId} />

        <GroupedInsetListCard showSeparator={false} className="mt-2 px-3 py-6">
          <Controller
            name="title"
            control={form.control}
            rules={{
              required: true,
            }}
            render={({ field: { onChange, onBlur, ref, value } }) => (
              <TextField
                label={t("lists.title")}
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
                  label={t("lists.description")}
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
                  label={t("lists.image")}
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
            <FormLabel label={t("lists.view")} className="mb-4 pl-2.5" optional />
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
                  label={t("lists.fee.label")}
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
              label={t("words.delete", { ns: "common" })}
              style="destructive"
              onPress={() => {
                showActionSheetWithOptions(
                  {
                    options: [
                      t("words.delete", { ns: "common" }),
                      t("words.cancel", { ns: "common" }),
                    ],
                    cancelButtonIndex: 1,
                    destructiveButtonIndex: 0,
                  },
                  async (index) => {
                    if (index === 0) {
                      await listSyncServices.deleteList({ listId: listId! })
                      navigation.dismiss()
                    }
                  },
                )
              }}
            />
          </GroupedInsetListCard>
        )}
      </SafeNavigationScrollView>
    </FormProvider>
  )
}

interface ScreenOptionsProps {
  title?: string
  listId?: string
}
const ScreenOptions = memo(({ title, listId }: ScreenOptionsProps) => {
  const { t } = useTranslation("settings")
  const form = useFormContext()

  const { isValid, isDirty } = form.formState

  const isEditing = !!listId
  const [isLoading, setIsLoading] = useState(false)

  const setModalOptions = useSetModalScreenOptions()
  useEffect(() => {
    setModalOptions({
      gestureEnabled: !isDirty,
    })
  }, [isDirty, setModalOptions])
  const navigation = useNavigation()

  return (
    <NavigationBlurEffectHeader
      title={title ? `${t("lists.edit.label")} - ${title}` : t("lists.create")}
      headerRight={
        <FormProvider form={form}>
          <HeaderSubmitButton
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
                    navigation.dismiss()
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
                  navigation.dismiss()
                })
            })}
          />
        </FormProvider>
      }
    />
  )
})
