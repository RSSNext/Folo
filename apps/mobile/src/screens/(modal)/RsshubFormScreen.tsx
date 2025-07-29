import type { RSSHubParameter, RSSHubParameterObject, RSSHubRoute } from "@follow/models/rsshub"
import { feedSyncServices } from "@follow/store/feed/store"
import {
  MissingOptionalParamError,
  parseFullPathParams,
  parseRegexpPathParams,
  regexpPathToPath,
} from "@follow/utils"
import { PortalProvider } from "@gorhom/portal"
import { zodResolver } from "@hookform/resolvers/zod"
import { memo, useEffect, useMemo, useState } from "react"
import type { FieldErrors } from "react-hook-form"
import { Controller, useForm } from "react-hook-form"
import { KeyboardAvoidingView, Linking, TouchableOpacity, View } from "react-native"
import { z } from "zod"

import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { FormProvider, useFormContext } from "@/src/components/ui/form/FormProvider"
import { Select } from "@/src/components/ui/form/Select"
import { TextField } from "@/src/components/ui/form/TextField"
import { MarkdownNative } from "@/src/components/ui/typography/MarkdownNative"
import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useSetModalScreenOptions } from "@/src/lib/navigation/ScreenOptionsContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { FeedSummary } from "@/src/modules/discover/FeedSummary"

import { FollowScreen } from "./FollowScreen"

interface RsshubFormParams {
  route: RSSHubRoute
  routePrefix: string
  name: string
}
export const RsshubFormScreen: NavigationControllerView<RsshubFormParams> = ({
  route,
  routePrefix,
  name,
}) => {
  const parsedRoute = useMemo(() => {
    if (!route) return null
    try {
      return typeof route === "string" ? JSON.parse(route) : route
    } catch {
      return null
    }
  }, [route])
  const navigation = useNavigation()
  const canBack = navigation.canGoBack()
  useEffect(() => {
    if (!parsedRoute && canBack) {
      navigation.back()
    }
  }, [canBack, navigation, parsedRoute])
  if (!parsedRoute || !routePrefix) {
    return null
  }
  return <FormImpl route={parsedRoute} routePrefix={routePrefix as string} name={name!} />
}
function FormImpl({ route, routePrefix, name }: RsshubFormParams) {
  const { name: routeName, topFeeds } = route
  const keys = useMemo(() => parseRegexpPathParams(route.path), [route.path])
  const formPlaceholder = useMemo<Record<string, string>>(() => {
    if (!route.example) return {}
    return parseFullPathParams(route.example.replace(`/${routePrefix}`, ""), route.path)
  }, [route.example, route.path, routePrefix])
  const dynamicFormSchema = useMemo(
    () =>
      z.object({
        ...Object.fromEntries(
          keys.map((keyItem) => [
            keyItem.name,
            keyItem.optional ? z.string().optional().nullable() : z.string().min(1),
          ]),
        ),
      }),
    [keys],
  )
  const defaultValue = useMemo(() => {
    const ret = {} as Record<string, string | null>
    if (!route.parameters) return ret
    for (const key in route.parameters) {
      const params = normalizeRSSHubParameters(route.parameters[key]!)
      if (!params) continue
      ret[key] = params.default
    }
    return ret
  }, [route.parameters])
  const form = useForm<z.infer<typeof dynamicFormSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: defaultValue,
    mode: "all",
  })

  // eslint-disable-next-line unicorn/prefer-structured-clone
  const nextErrors = JSON.parse(JSON.stringify(form.formState.errors))
  const data = form.watch() as Record<string, string | undefined>
  const fullPath = useMemo(() => {
    try {
      return regexpPathToPath(route.path, data)
    } catch (err: unknown) {
      console.info((err as Error).message)
      return route.path
    }
  }, [route.path, data])
  return (
    <FormProvider form={form}>
      <PortalProvider>
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <SafeNavigationScrollView className="bg-system-grouped-background">
            <ScreenOptions
              name={name}
              routeName={routeName}
              route={route.path}
              routePrefix={routePrefix}
              errors={nextErrors}
            />
            <Text className="text-secondary-label mx-4 mt-2 text-center text-sm">
              {`rsshub://${routePrefix}${fullPath}`}
            </Text>
            {keys.length === 0 && (
              <View className="bg-secondary-system-grouped-background mx-2 mt-4 gap-4 rounded-lg p-3">
                <Text className="text-label text-center text-base">
                  This feed has no parameters.
                </Text>
              </View>
            )}
            {keys.length > 0 && (
              <View className="bg-secondary-system-grouped-background mx-4 mt-4 gap-5 rounded-[10px] px-4 py-5">
                {keys.map((keyItem) => {
                  const parameters = normalizeRSSHubParameters(route.parameters[keyItem.name]!)
                  return (
                    <View key={keyItem.name}>
                      {!parameters?.options && (
                        <Controller
                          name={keyItem.name}
                          control={form.control}
                          rules={{
                            required: !keyItem.optional,
                            // validate: (value) => {
                            //   return dynamicFormSchema.safeParse({
                            //     [keyItem.name]: value,
                            //   }).success
                            // },
                          }}
                          render={({ field: { onChange, onBlur, ref, value } }) => (
                            <KeyboardAvoidingView behavior="padding">
                              <TextField
                                label={keyItem.name}
                                required={!keyItem.optional}
                                wrapperClassName="mt-2"
                                placeholder={formPlaceholder[keyItem.name]}
                                onBlur={onBlur}
                                onChangeText={onChange}
                                defaultValue={defaultValue[keyItem.name] ?? ""}
                                value={value ?? ""}
                                ref={ref}
                              />
                            </KeyboardAvoidingView>
                          )}
                        />
                      )}

                      {!!parameters?.options && (
                        <Controller
                          name={keyItem.name}
                          control={form.control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              label={keyItem.name}
                              options={parameters.options ?? []}
                              value={value}
                              onValueChange={onChange}
                            />
                          )}
                        />
                      )}

                      {!!parameters && (
                        <Text className="text-secondary-label ml-2 mt-1 text-xs">
                          {parameters.description}
                        </Text>
                      )}
                    </View>
                  )
                })}
              </View>
            )}
            {!!topFeeds?.length && (
              <View className="bg-secondary-system-grouped-background mx-4 mt-4 rounded-[10px] py-1">
                {topFeeds.map((feed) => (
                  <FeedSummary
                    key={feed.id}
                    item={{
                      feed,
                    }}
                    simple
                    className="px-4 py-2"
                  />
                ))}
              </View>
            )}
            <Maintainers maintainers={route.maintainers} />

            {!!route.description && (
              <View className="mt-6 flex-1 px-8">
                <MarkdownNative value={route.description.replaceAll(":::", "")} />
              </View>
            )}
          </SafeNavigationScrollView>
        </KeyboardAvoidingView>
      </PortalProvider>
    </FormProvider>
  )
}
const Maintainers = ({ maintainers }: { maintainers?: string[] }) => {
  if (!maintainers || maintainers.length === 0) {
    return null
  }
  return (
    <View className="text-tertiary-label mx-8 mt-4 flex flex-row flex-wrap gap-x-1 text-sm">
      <Text className="text-secondary-label text-xs">
        This feed is provided by RSSHub, with credit to{" "}
      </Text>
      {maintainers.map((m) => (
        <TouchableOpacity key={m} onPress={() => Linking.openURL(`https://github.com/${m}`)}>
          <Text className="text-accent/90 text-xs">@{m}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
const normalizeRSSHubParameters = (parameters: RSSHubParameter): RSSHubParameterObject | null =>
  parameters
    ? typeof parameters === "string"
      ? {
          description: parameters,
          default: null,
        }
      : parameters
    : null
type ScreenOptionsProps = {
  name: string
  routeName: string
  route: string
  routePrefix: string
  errors: FieldErrors
}
const ScreenOptions = memo(
  ({ name, routeName, route, routePrefix, errors }: ScreenOptionsProps) => {
    const form = useFormContext()
    const setScreenOptions = useSetModalScreenOptions()
    useEffect(() => {
      setScreenOptions({
        preventNativeDismiss: form.formState.isDirty,
        gestureEnabled: !form.formState.isDirty,
      })
    }, [form.formState.isDirty, setScreenOptions])
    return (
      <NavigationBlurEffectHeader
        title={`${name} - ${routeName}`}
        headerRight={
          <FormProvider form={form}>
            <ModalHeaderSubmitButtonImpl errors={errors} routePrefix={routePrefix} route={route} />
          </FormProvider>
        }
      />
    )
  },
)
const routeParamsKeyPrefix = "route-params-"
const ModalHeaderSubmitButtonImpl = ({
  routePrefix,
  route,
  errors,
}: {
  routePrefix: string
  route: string
  errors: FieldErrors
}) => {
  const form = useFormContext()
  const isValid = Object.keys(errors).length === 0
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(false)
  const submit = form.handleSubmit((_data) => {
    setIsLoading(true)
    const data = Object.fromEntries(
      Object.entries(_data).filter(([key]) => !key.startsWith(routeParamsKeyPrefix)),
    )
    try {
      const routeParamsPath = encodeURIComponent(
        Object.entries(_data)
          .filter(([key, value]) => key.startsWith(routeParamsKeyPrefix) && value)
          .map(([key, value]) => [key.slice(routeParamsKeyPrefix.length), value])
          .map(([key, value]) => `${key}=${value}`)
          .join("&"),
      )
      const fillRegexpPath = regexpPathToPath(
        routeParamsPath ? route.slice(0, route.indexOf("/:routeParams")) : route,
        data,
      )
      const url = `rsshub://${routePrefix}${fillRegexpPath}`
      const finalUrl = routeParamsPath ? `${url}/${routeParamsPath}` : url
      feedSyncServices
        .fetchFeedById({
          url: finalUrl,
        })
        .then((feed) => {
          navigation.pushControllerView(FollowScreen, {
            id: feed?.id,
            type: "url" as const,
            url: finalUrl,
          })
        })
        .catch(() => {
          toast.error("Failed to fetch feed")
        })
        .finally(() => {
          setIsLoading(false)
        })
    } catch (err: unknown) {
      if (err instanceof MissingOptionalParamError) {
        toast.error(err.message)
        // const idx = keys.findIndex((item) => item.name === err.param)
        // form.setFocus(keys[idx === 0 ? 0 : idx - 1].name, {
        //   shouldSelect: true,
        // })
      }
    }
  })
  return (
    <HeaderSubmitTextButton isLoading={isLoading} isValid={isValid} onPress={submit} label="Next" />
  )
}
