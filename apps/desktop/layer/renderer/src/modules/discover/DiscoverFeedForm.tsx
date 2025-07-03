import { Spring } from "@follow/components/constants/spring.js"
import { Button } from "@follow/components/ui/button/index.js"
import { Form, FormField, FormItem, FormLabel } from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { RootPortal } from "@follow/components/ui/portal/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { nextFrame } from "@follow/utils/dom"
import {
  MissingOptionalParamError,
  parseFullPathParams,
  parseRegexpPathParams,
  regexpPathToPath,
} from "@follow/utils/path-parser"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { m } from "motion/react"
import type { FC } from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import {
  useCurrentModal,
  useIsInModal,
  useIsTopModal,
  useModalStack,
} from "~/components/ui/modal/stacked/hooks"

import { FeedForm } from "./FeedForm"
import type { RSSHubRoute } from "./types"
import { normalizeRSSHubParameters } from "./utils"

const FeedMaintainers = ({ maintainers }: { maintainers?: string[] }) => {
  if (!maintainers || maintainers.length === 0) {
    return null
  }

  return (
    <div className="text-text mb-2 flex flex-col gap-x-1 text-sm">
      <Trans
        i18nKey="discover.feed_maintainers"
        components={{
          maintainers: (
            <span className="inline-flex flex-wrap items-center gap-2">
              {maintainers.map((maintainer) => (
                <a
                  href={`https://github.com/${maintainer}`}
                  key={maintainer}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-text-secondary hover:text-accent inline-flex cursor-pointer items-center duration-200"
                >
                  @{maintainer}
                  <i className="i-mgc-external-link-cute-re ml-0.5" />
                </a>
              ))}
            </span>
          ),
        }}
      />
    </div>
  )
}

const routeParamsKeyPrefix = "route-params-"

export type RouteParams = Record<
  string,
  {
    description: string
    default?: string
  }
>

export const DiscoverFeedForm = ({
  route,
  routePrefix,
  noDescription,
  routeParams,
  viewportClassName,
  rootClassName,
}: {
  route: RSSHubRoute
  routePrefix: string
  noDescription?: boolean
  routeParams?: RouteParams
  viewportClassName?: string
  rootClassName?: string
}) => {
  const { t } = useTranslation()
  const keys = useMemo(() => parseRegexpPathParams(route.path), [route.path])

  const formPlaceholder = useMemo<Record<string, string>>(() => {
    if (!route.example) return {}
    return parseFullPathParams(route.example.replace(`/${routePrefix}`, ""), route.path)
  }, [route.example, route.path, routePrefix])
  const dynamicFormSchema = useMemo(
    () =>
      z.object({
        ...Object.fromEntries(
          keys
            .map((keyItem) => [
              keyItem.name,
              keyItem.optional ? z.string().optional().nullable() : z.string().min(1),
            ])
            .concat(
              routeParams
                ? Object.entries(routeParams).map(([key]) => [
                    `${routeParamsKeyPrefix}${key}`,
                    z.string(),
                  ])
                : [],
            ),
        ),
      }),
    [keys, routeParams],
  )

  const defaultValue = useMemo(() => {
    const ret = {}
    if (!route.parameters) return ret
    for (const key in route.parameters) {
      const params = normalizeRSSHubParameters(route.parameters[key]!)
      if (!params) continue
      ret[key] = params.default || ""
    }
    return ret
  }, [route.parameters])

  const form = useForm<z.infer<typeof dynamicFormSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: defaultValue,
    mode: "all",
  }) as UseFormReturn<any>

  const { present, dismissAll } = useModalStack()
  const rootContainerRef = useRef<HTMLDivElement>(null)
  const isInModal = useIsInModal()

  const onSubmit = useCallback(
    (_data: Record<string, string>) => {
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
          routeParams && routeParamsPath
            ? route.path.slice(0, route.path.indexOf("/:routeParams"))
            : route.path,
          data,
        )
        const url = `rsshub://${routePrefix}${fillRegexpPath}`

        const finalUrl = routeParams && routeParamsPath ? `${url}/${routeParamsPath}` : url

        present({
          title: t("feed_form.add_feed"),
          modalContentClassName: "overflow-visible",
          content: () => <FeedForm url={finalUrl} onSuccess={dismissAll} />,
        })
      } catch (err: unknown) {
        if (err instanceof MissingOptionalParamError) {
          toast.error(err.message)
          const idx = keys.findIndex((item) => item.name === err.param)

          form.setFocus(keys[idx === 0 ? 0 : idx - 1]!.name, {
            shouldSelect: true,
          })
        }
      }
    },
    [dismissAll, form, keys, present, route, routeParams, routePrefix],
  )

  const formElRef = useRef<HTMLFormElement>(null)
  const isTop = useIsTopModal()
  useLayoutEffect(() => {
    if (!isTop) return
    const $form = formElRef.current
    if (!$form) return
    $form.querySelectorAll("input")[0]?.focus()
  }, [formElRef, isTop])

  const modal = useCurrentModal()

  useEffect(() => {
    modal.setClickOutSideToDismiss(!form.formState.isDirty)
  }, [form.formState.isDirty, modal])

  return (
    <div className={cn("flex h-full flex-col", "mx-auto")} ref={rootContainerRef}>
      <Form {...form}>
        <ScrollArea.ScrollArea
          rootClassName={cn(isInModal && "-mx-4 -mt-4", rootClassName)}
          viewportClassName={cn("pt-4 px-4 max-h-[calc(100vh-200px)]", viewportClassName)}
        >
          <div className="flex">
            <div className="w-0 grow truncate">
              {!noDescription && (
                <PreviewUrl
                  watch={form.watch}
                  path={route.path}
                  routePrefix={`rsshub://${routePrefix}`}
                />
              )}
              <form
                id="discover-feed-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 px-1"
                ref={formElRef}
              >
                {keys.map((keyItem) => {
                  const parameters = normalizeRSSHubParameters(route.parameters?.[keyItem.name]!)

                  const { ref } = form.register(keyItem.name)

                  return (
                    <FormField
                      control={form.control}
                      key={keyItem.name}
                      name={keyItem.name}
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2">
                          <FormLabel className="text-text text-headline pl-3 capitalize">
                            {keyItem.name}
                            {!keyItem.optional && <sup className="text-red ml-1 align-sub">*</sup>}
                          </FormLabel>
                          {parameters?.options ? (
                            <Select
                              {...field}
                              onValueChange={(value) => {
                                field.onChange(value)
                              }}
                              defaultValue={parameters.default || void 0}
                            >
                              <SelectTrigger ref={ref}>
                                <SelectValue placeholder={t("discover.select_placeholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                {parameters.options.map((option) => (
                                  <SelectItem key={option.value} value={option.value || ""}>
                                    {option.label}
                                    {parameters.default === option.value &&
                                      t("discover.default_option")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              {...field}
                              onBlur={() => {
                                nextFrame(() => {
                                  field.onBlur()
                                })
                              }}
                              placeholder={
                                (parameters?.default ?? formPlaceholder[keyItem.name])
                                  ? `e.g. ${formPlaceholder[keyItem.name]}`
                                  : void 0
                              }
                            />
                          )}
                          {!!parameters && (
                            <Markdown className="text-text-secondary text-footnote w-full max-w-full whitespace-normal break-all pl-3">
                              {parameters.description}
                            </Markdown>
                          )}
                        </FormItem>
                      )}
                    />
                  )
                })}
                {routeParams && (
                  <div className="grid grid-cols-1 gap-x-2 gap-y-5 sm:grid-cols-2">
                    {Object.entries(routeParams).map(([key, value]) => (
                      <FormItem
                        key={`${routeParamsKeyPrefix}${key}`}
                        className="flex flex-col space-y-2"
                      >
                        <FormLabel className="text-text text-headline pl-3 capitalize">
                          {key}
                        </FormLabel>
                        <Input
                          {...form.register(`${routeParamsKeyPrefix}${key}`)}
                          placeholder={value.default}
                          className="grow-0"
                        />
                        {!!value.description && (
                          <Markdown className="text-text-secondary text-footnote w-full max-w-full text-wrap pl-3">
                            {value.description}
                          </Markdown>
                        )}
                      </FormItem>
                    ))}
                  </div>
                )}
                {!noDescription && (
                  <>
                    <FeedMaintainers maintainers={route.maintainers} />
                  </>
                )}

                <RootPortal to={rootContainerRef.current}>
                  <div className="flex items-center justify-end gap-4 pt-2">
                    <Button form="discover-feed-form" type="submit">
                      {t("discover.preview")}
                    </Button>
                  </div>
                </RootPortal>
              </form>
            </div>
          </div>
        </ScrollArea.ScrollArea>
      </Form>

      {!noDescription && <ReadmeAside description={route.description} />}
    </div>
  )
}

const ReadmeAside = ({ description }: { description?: string }) => {
  const { modalElementRef } = useCurrentModal()
  const { t } = useTranslation()
  useLayoutEffect(() => {
    if (!modalElementRef.current) return
    modalElementRef.current.style.overflow = "visible"
    modalElementRef.current.style.zIndex = "2"
  }, [modalElementRef])

  if (!description) return null
  return (
    <RootPortal to={modalElementRef.current}>
      <div className="absolute inset-y-0 -right-px z-0">
        <m.div
          className="bg-background border-border absolute inset-y-0 left-0 z-[-1] flex w-[40ch] flex-col rounded-md border pt-4 shadow-lg"
          initial={{ x: "-50px" }}
          animate={{ x: "0px" }}
          transition={Spring.presets.smooth}
        >
          <h3 className="text-headline mb-2 shrink-0 px-4 font-medium">
            {t("discover.feed_description")}
          </h3>
          <ScrollArea.ScrollArea viewportClassName="px-4 pb-4" rootClassName="h-0 grow">
            <div className="pr-4">
              <Markdown className="prose-p:my-1 w-full cursor-text select-text break-words">
                {/* Fix markdown directive */}
                {description.replaceAll("::: ", ":::")}
              </Markdown>
            </div>
          </ScrollArea.ScrollArea>
        </m.div>
      </div>
    </RootPortal>
  )
}

const PreviewUrl: FC<{
  watch: UseFormReturn<any>["watch"]
  path: string
  routePrefix: string
}> = ({ watch, path, routePrefix }) => {
  const data = watch()

  const fullPath = useMemo(() => {
    try {
      return regexpPathToPath(path, data)
    } catch (err: unknown) {
      console.info((err as Error).message)
      return path
    }
  }, [path, data])

  const renderedPath = `${routePrefix}${fullPath}`
  return (
    <div className="group relative min-w-0 px-1 pb-2">
      <pre className="bg-material-medium text-text-secondary relative w-full whitespace-pre-line break-words rounded p-2 text-xs">
        {renderedPath}
        <div className="absolute right-1 top-1/2 -translate-y-1/2">
          <CopyButton
            variant="outline"
            value={renderedPath}
            className="opacity-0 duration-200 group-hover:opacity-100"
          />
        </div>
      </pre>
    </div>
  )
}
