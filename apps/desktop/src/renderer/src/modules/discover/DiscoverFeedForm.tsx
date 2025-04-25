import { Button } from "@follow/components/ui/button/index.js"
import { Form, FormItem, FormLabel } from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.jsx"
import { FeedViewType } from "@follow/constants"
import { nextFrame } from "@follow/utils/dom"
import {
  MissingOptionalParamError,
  parseFullPathParams,
  parseRegexpPathParams,
  regexpPathToPath,
} from "@follow/utils/path-parser"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import type { FC } from "react"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react"
import type { UseFormReturn } from "react-hook-form"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { CopyButton } from "~/components/ui/button/CopyButton"
import { Markdown } from "~/components/ui/markdown/Markdown"
import { useCurrentModal, useIsTopModal, useModalStack } from "~/components/ui/modal/stacked/hooks"
import { getViewFromRoute } from "~/lib/utils"

import { FeedForm } from "./feed-form"
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

const FeedDescription = ({ description }: { description?: string }) => {
  const { t } = useTranslation()
  if (!description) {
    return null
  }

  return (
    <>
      <p>{t("discover.feed_description")}</p>
      <Markdown className="prose-p:my-1 w-full max-w-full cursor-text select-text break-all">
        {/* Fix markdown directive */}
        {description.replaceAll("::: ", ":::")}
      </Markdown>
    </>
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
  submitButtonClassName,
  routeParams,
}: {
  route: RSSHubRoute
  routePrefix: string
  noDescription?: boolean
  submitButtonClassName?: string
  routeParams?: RouteParams
}) => {
  const { t } = useTranslation()
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
        forceExcludeNames: routeParams ? ["routeParams"] : [],
      }),
    [route.path, routeParams],
  )

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
      ret[key] = params.default
    }
    return ret
  }, [route.parameters])

  const form = useForm<z.infer<typeof dynamicFormSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: defaultValue,
    mode: "all",
  }) as UseFormReturn<any>

  const { present, dismissAll } = useModalStack()

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

        const defaultView = getViewFromRoute(route) || FeedViewType.Articles

        present({
          title: t("feed_form.add_feed"),
          content: () => (
            <FeedForm
              url={finalUrl}
              defaultValues={{
                view: defaultView.toString(),
              }}
              onSuccess={dismissAll}
            />
          ),
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
    <Form {...form}>
      {!noDescription && (
        <PreviewUrl watch={form.watch} path={route.path} routePrefix={`rsshub://${routePrefix}`} />
      )}
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)} ref={formElRef}>
        {keys.map((keyItem) => {
          const parameters = normalizeRSSHubParameters(route.parameters?.[keyItem.name]!)

          const { ref, ...formRegister } = form.register(keyItem.name)

          return (
            <FormItem key={keyItem.name} className="flex flex-col space-y-2">
              <FormLabel className="text-text text-headline pl-3 capitalize">
                {keyItem.name}
                {!keyItem.optional && <sup className="text-red ml-1 align-sub">*</sup>}
              </FormLabel>
              {parameters?.options ? (
                <Select
                  {...formRegister}
                  onValueChange={(value) => {
                    form.setValue(keyItem.name, value)
                  }}
                  defaultValue={parameters.default || void 0}
                >
                  {/* Select focused ref on `SelectTrigger` or `Select` */}
                  <SelectTrigger ref={ref}>
                    <SelectValue placeholder={t("discover.select_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {parameters.options.map((option) => (
                      <SelectItem key={option.value} value={option.value || ""}>
                        {option.label}
                        {parameters.default === option.value && t("discover.default_option")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  {...formRegister}
                  onBlur={(e) => {
                    // Fix #535
                    nextFrame(() => {
                      formRegister.onBlur(e)
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
                <Markdown className="text-text-secondary text-footnote w-full max-w-full pl-3">
                  {parameters.description}
                </Markdown>
              )}
            </FormItem>
          )
        })}
        {routeParams && (
          <div className="grid grid-cols-1 gap-x-2 gap-y-5 sm:grid-cols-2">
            {Object.entries(routeParams).map(([key, value]) => (
              <FormItem key={`${routeParamsKeyPrefix}${key}`} className="flex flex-col space-y-2">
                <FormLabel className="text-text text-headline pl-3 capitalize">{key}</FormLabel>
                <Input
                  {...form.register(`${routeParamsKeyPrefix}${key}`)}
                  placeholder={value.default}
                  className="grow-0"
                />
                {!!value.description && (
                  <Markdown className="text-text-secondary text-footnote w-full max-w-full pl-3">
                    {value.description}
                  </Markdown>
                )}
              </FormItem>
            ))}
          </div>
        )}
        {!noDescription && (
          <>
            <FeedDescription description={route.description} />
            <FeedMaintainers maintainers={route.maintainers} />
          </>
        )}
        <div
          className={cn(
            "sticky bottom-0 -mt-4 mb-1 flex w-full justify-end pt-3",
            submitButtonClassName,
          )}
        >
          <Button type="submit">{t("discover.preview")}</Button>
        </div>
      </form>
    </Form>
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
    <div className="group relative min-w-0 pb-4">
      <pre className="text-text-tertiary w-full whitespace-pre-line break-words text-xs">
        {renderedPath}
      </pre>
      <CopyButton
        variant="outline"
        value={renderedPath}
        className="absolute right-0 top-0 opacity-0 duration-200 group-hover:opacity-100"
      />
    </div>
  )
}
