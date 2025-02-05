import type { RSSHubParameter, RSSHubParameterObject, RSSHubRoute } from "@follow/models/src/rsshub"
import {
  MissingOptionalParamError,
  parseFullPathParams,
  parseRegexpPathParams,
  regexpPathToPath,
} from "@follow/utils"
import { PortalProvider } from "@gorhom/portal"
import { zodResolver } from "@hookform/resolvers/zod"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { memo, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Linking, Text, TouchableOpacity, View } from "react-native"
import { z } from "zod"

import { BlurEffectWithBottomBorder } from "@/src/components/common/BlurEffect"
import { HeaderTitleExtra } from "@/src/components/common/HeaderTitleExtra"
import {
  ModalHeaderCloseButton,
  ModalHeaderSubmitButton,
} from "@/src/components/common/ModalSharedComponents"
import { SafeModalScrollView } from "@/src/components/common/SafeModalScrollView"
import { FormProvider, useFormContext } from "@/src/components/ui/form/FormProvider"
import { Select } from "@/src/components/ui/form/Select"
import { TextField } from "@/src/components/ui/form/TextField"
import { Markdown } from "@/src/components/ui/typography/Markdown"
import { toast } from "@/src/lib/toast"
import { feedSyncServices } from "@/src/store/feed/store"

interface RsshubFormParams {
  route: RSSHubRoute
  routePrefix: string
  name: string
}
export default function RsshubForm() {
  const params = useLocalSearchParams()

  const { route, routePrefix, name } = (params || {}) as Record<string, string>

  const parsedRoute = useMemo(() => {
    if (!route) return null
    try {
      return typeof route === "string" ? JSON.parse(route) : route
    } catch {
      return null
    }
  }, [route])

  const canBack = router.canDismiss()
  useEffect(() => {
    if (!parsedRoute && canBack) {
      router.dismiss()
    }
  }, [canBack, parsedRoute])
  if (!parsedRoute || !routePrefix) {
    return null
  }
  return <FormImpl route={parsedRoute} routePrefix={routePrefix as string} name={name!} />
}

function FormImpl({ route, routePrefix, name }: RsshubFormParams) {
  const { name: routeName } = route
  const keys = useMemo(
    () =>
      parseRegexpPathParams(route.path, {
        excludeNames: [
          "routeParams",
          "functionalFlag",
          "fulltext",
          "disableEmbed",
          "date",
          "language",
          "lang",
          "sort",
        ],
      }),
    [route.path],
  )

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

  return (
    <FormProvider form={form}>
      <ScreenOptions
        name={name}
        routeName={routeName}
        route={route.path}
        routePrefix={routePrefix}
      />

      <PortalProvider>
        <SafeModalScrollView className="bg-system-grouped-background">
          <View className="bg-secondary-system-grouped-background mx-2 mt-2 gap-4 rounded-lg px-3 py-6">
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
          <Maintainers maintainers={route.maintainers} />

          {!!route.description && (
            <View className="bg-system-background border-t-hairline border-opaque-separator mt-4 flex-1 px-4">
              <Markdown
                style={{
                  paddingTop: 16,
                  paddingBottom: 16,
                }}
                value={route.description.replaceAll("::: ", ":::")}
                webViewProps={{ matchContents: true, scrollEnabled: false }}
              />
            </View>
          )}
        </SafeModalScrollView>
      </PortalProvider>
    </FormProvider>
  )
}

const Maintainers = ({ maintainers }: { maintainers?: string[] }) => {
  if (!maintainers || maintainers.length === 0) {
    return null
  }

  return (
    <View className="text-tertiary-label mx-4 mt-2 flex flex-row flex-wrap gap-x-1 text-sm">
      <Text className="text-secondary-label text-xs">
        This feed is provided by RSSHub, with credit to{" "}
      </Text>
      {maintainers.map((m) => (
        <TouchableOpacity key={m} onPress={() => Linking.openURL(`https://github.com/${m}`)}>
          <Text className="text-xs text-accent/90">@{m}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const normalizeRSSHubParameters = (parameters: RSSHubParameter): RSSHubParameterObject | null =>
  parameters
    ? typeof parameters === "string"
      ? { description: parameters, default: null }
      : parameters
    : null

type ScreenOptionsProps = {
  name: string
  routeName: string
  route: string
  routePrefix: string
}
const ScreenOptions = memo(({ name, routeName, route, routePrefix }: ScreenOptionsProps) => {
  const form = useFormContext()

  return (
    <Stack.Screen
      options={{
        headerLeft: ModalHeaderCloseButton,
        gestureEnabled: !form.formState.isDirty,
        headerBackground: BlurEffectWithBottomBorder,
        headerTransparent: true,

        headerRight: () => (
          <FormProvider form={form}>
            <ModalHeaderSubmitButtonImpl routePrefix={routePrefix} route={route} />
          </FormProvider>
        ),

        headerTitle: () => (
          <Title name={name} routeName={routeName} route={route} routePrefix={routePrefix} />
        ),
      }}
    />
  )
})

const Title = ({ name, routeName, route, routePrefix }: ScreenOptionsProps) => {
  return (
    <HeaderTitleExtra subText={`rsshub://${routePrefix}${route}`}>
      {`${name} - ${routeName}`}
    </HeaderTitleExtra>
  )
}

const routeParamsKeyPrefix = "route-params-"

const ModalHeaderSubmitButtonImpl = ({
  routePrefix,
  route,
}: {
  routePrefix: string
  route: string
}) => {
  const form = useFormContext()
  const { isValid } = form.formState

  const [isLoading, setIsLoading] = useState(false)

  const submit = form.handleSubmit((_data) => {
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

      // if (router.canDismiss()) {
      //   router.dismiss()
      // }

      setIsLoading(true)

      feedSyncServices
        .fetchFeedById({ url: finalUrl })
        .then((feed) => {
          router.push({
            pathname: "/follow",
            params: {
              url: finalUrl,
              id: feed?.id,
            },
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

  return <ModalHeaderSubmitButton isLoading={isLoading} isValid={isValid} onPress={submit} />
}
