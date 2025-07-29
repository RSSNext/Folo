import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Button, MotionButtonBase } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { SegmentGroup, SegmentItem } from "@follow/components/ui/segment/index.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { zodResolver } from "@hookform/resolvers/zod"
import { repository } from "@pkg"
import { useMutation } from "@tanstack/react-query"
import { produce } from "immer"
import { atom, useAtomValue, useStore } from "jotai"
import type { ChangeEvent } from "react"
import { useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router"
import { z } from "zod"

import { useIsInMASReview } from "~/atoms/server-configs"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { apiClient } from "~/lib/api-fetch"

import { DiscoverFeedCard } from "./DiscoverFeedCard"
import { FeedForm } from "./FeedForm"

const formSchema = z.object({
  keyword: z.string().min(1),
  target: z.enum(["feeds", "lists"]),
})

const info: Record<
  string,
  {
    label: I18nKeys
    prefix?: string[]
    showModal?: boolean
    default?: string
    labelSuffix?: React.ReactNode
  }
> = {
  search: {
    label: "discover.any_url_or_keyword",
  },
  rss: {
    label: "discover.rss_url",
    default: "https://",
    prefix: ["https://", "http://"],
    showModal: true,
    labelSuffix: (
      <a
        href={`${repository.url}/wiki/Folo-Flavored-Feed-Spec`}
        target="_blank"
        rel="noreferrer"
        className="text-accent border-accent inline-flex w-auto items-center gap-1 rounded-full border px-2 py-px text-sm font-normal"
      >
        <i className="i-mgc-book-6-cute-re" />
        <span>Folo Flavored Feed Spec</span>
      </a>
    ),
  },
  rsshub: {
    label: "discover.rss_hub_route",
    prefix: ["rsshub://"],
    default: "rsshub://",
    showModal: true,
    labelSuffix: (
      <a
        href="https://docs.rsshub.app/"
        target="_blank"
        rel="noreferrer"
        className="text-accent border-accent inline-flex w-auto items-center gap-1 rounded-full border px-2 py-px text-sm font-normal"
      >
        <i className="i-mgc-book-6-cute-re" />
        <span>RSSHub Docs</span>
      </a>
    ),
  },
}

type DiscoverSearchData = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"]

const discoverSearchDataAtom = atom<Record<string, DiscoverSearchData>>()

export function DiscoverForm({ type = "search" }: { type?: string }) {
  const { prefix, default: defaultValue } = info[type]!

  const [searchParams, setSearchParams] = useSearchParams()
  const keywordFromSearch = searchParams.get("keyword") || ""
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: defaultValue || keywordFromSearch || "",
      target: "feeds",
    },
  })
  const { watch, trigger } = form
  // validate default value from search params
  useEffect(() => {
    if (!keywordFromSearch) {
      return
    }
    trigger("keyword")
  }, [trigger])

  const target = watch("target")
  const atomKey = keywordFromSearch + target
  const { t } = useTranslation()
  const isInMASReview = useIsInMASReview()

  const jotaiStore = useStore()
  const mutation = useMutation({
    mutationFn: async ({ keyword, target }: { keyword: string; target: "feeds" | "lists" }) => {
      let { data } = await apiClient.discover.$post({
        json: {
          keyword: keyword.trim(),
          target,
        },
      })
      if (isInMASReview) {
        data = data.filter((item) => !item.list?.fee)
      }

      jotaiStore.set(discoverSearchDataAtom, (prev) => ({
        ...prev,
        [atomKey]: data,
      }))

      return data
    },
  })

  const discoverSearchData = useAtomValue(discoverSearchDataAtom)?.[atomKey] || []

  const { present, dismissAll } = useModalStack()

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (info[type]!.showModal) {
      present({
        title: t("feed_form.add_feed"),
        content: () => <FeedForm url={values.keyword} onSuccess={dismissAll} />,
      })
    } else {
      mutation.mutate(values)
    }
  }

  const handleKeywordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const syncKeyword = (keyword: string) => {
        setSearchParams(
          (prev) => {
            const newParams = new URLSearchParams(prev)
            if (keyword) {
              newParams.set("keyword", keyword)
            } else {
              newParams.delete("keyword")
            }
            return newParams
          },
          {
            replace: true,
          },
        )
      }

      const trimmedKeyword = event.target.value.trimStart()
      if (!prefix) {
        form.setValue("keyword", trimmedKeyword, { shouldValidate: true })
        syncKeyword(trimmedKeyword)
        return
      }
      const isValidPrefix = prefix.find((p) => trimmedKeyword.startsWith(p))
      if (!isValidPrefix) {
        form.setValue("keyword", prefix[0]!)
        syncKeyword(prefix[0]!)
        return
      }
      if (trimmedKeyword.startsWith(`${isValidPrefix}${isValidPrefix}`)) {
        form.setValue("keyword", trimmedKeyword.slice(isValidPrefix.length))
        syncKeyword(trimmedKeyword.slice(isValidPrefix.length))
        return
      }
      form.setValue("keyword", trimmedKeyword)
      syncKeyword(trimmedKeyword)
    },
    [form, prefix, setSearchParams],
  )

  const handleSuccess = useCallback(
    (item: DiscoverSearchData[number]) => {
      const currentData = jotaiStore.get(discoverSearchDataAtom)
      if (!currentData) return
      jotaiStore.set(
        discoverSearchDataAtom,
        produce(currentData, (draft) => {
          const sub = (draft[atomKey] || []).find((i) => {
            if (item.feed) {
              return i.feed?.id === item.feed.id
            }
            if (item.list) {
              return i.list?.id === item.list.id
            }
            return false
          })
          if (!sub) return
          sub.subscriptionCount = -~(sub.subscriptionCount as number)
        }),
      )
    },
    [discoverSearchDataAtom, jotaiStore],
  )

  const handleUnSubscribed = useCallback(
    (item: DiscoverSearchData[number]) => {
      const currentData = jotaiStore.get(discoverSearchDataAtom)
      if (!currentData) return
      jotaiStore.set(
        discoverSearchDataAtom,
        produce(currentData, (draft) => {
          const sub = (draft[atomKey] || []).find(
            (i) => i.feed?.id === item.feed?.id || i.list?.id === item.list?.id,
          )
          if (!sub) return
          sub.subscriptionCount = Number.isNaN(sub.subscriptionCount)
            ? 0
            : (sub.subscriptionCount as number) - 1
        }),
      )
    },
    [discoverSearchDataAtom, jotaiStore],
  )

  const handleTargetChange = useCallback(
    (value: string) => {
      form.setValue("target", value as "feeds" | "lists")
    },
    [form],
  )

  const isMobile = useMobile()

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-[540px]"
          data-testid="discover-form"
        >
          <div className="p-5">
            <FormField
              control={form.control}
              name="keyword"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel className="text-text text-headline mb-2 flex items-center gap-2 pl-2 font-bold">
                    {t(info[type]?.label!)}
                    {info[type]?.labelSuffix}
                  </FormLabel>
                  <FormControl>
                    <Input
                      autoFocus
                      {...field}
                      onChange={handleKeywordChange}
                      placeholder={type === "search" ? "Enter URL or keyword..." : undefined}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {type === "search" && (
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem className="mb-4 pl-2">
                    <div className="mb-2 flex items-center justify-between">
                      <FormLabel className="text-text-secondary text-headline font-medium">
                        {t("discover.target.label")}
                      </FormLabel>
                      <FormControl>
                        <div className="flex">
                          {isMobile ? (
                            <ResponsiveSelect
                              size="sm"
                              value={field.value}
                              onValueChange={handleTargetChange}
                              items={[
                                { label: t("discover.target.feeds"), value: "feeds" },
                                { label: t("discover.target.lists"), value: "lists" },
                              ]}
                            />
                          ) : (
                            <SegmentGroup
                              className="-mt-2 h-8"
                              value={field.value}
                              onValueChanged={handleTargetChange}
                            >
                              <SegmentItem value="feeds" label={t("discover.target.feeds")} />
                              <SegmentItem value="lists" label={t("discover.target.lists")} />
                            </SegmentGroup>
                          )}
                        </div>
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="center flex" data-testid="discover-form-actions">
              <Button
                disabled={!form.formState.isValid}
                type="submit"
                isLoading={mutation.isPending}
              >
                {info[type]!.showModal ? t("discover.preview") : t("words.search")}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <div className="mt-8 w-full max-w-lg">
        {(mutation.isSuccess || !!discoverSearchData?.length) && (
          <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500">
            {t("discover.search.results", { count: discoverSearchData?.length || 0 })}

            {discoverSearchData && discoverSearchData.length > 0 && (
              <MotionButtonBase
                className="hover:text-accent cursor-button flex items-center justify-between gap-2"
                type="button"
                onClick={() => {
                  jotaiStore.set(discoverSearchDataAtom, {
                    ...jotaiStore.get(discoverSearchDataAtom),
                    [atomKey]: [],
                  })
                  mutation.reset()
                }}
              >
                <i className="i-mgc-close-cute-re" />
              </MotionButtonBase>
            )}
          </div>
        )}
        <div className="space-y-4 text-sm">
          {discoverSearchData?.map((item) => (
            <DiscoverFeedCard
              key={item.feed?.id || item.list?.id}
              item={item}
              onSuccess={handleSuccess}
              onUnSubscribed={handleUnSubscribed}
              className="last:border-b-0"
            />
          ))}
        </div>
      </div>
    </>
  )
}
