import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent, CardFooter, CardHeader } from "@follow/components/ui/card/index.jsx"
import { RelativeTime } from "@follow/components/ui/datetime/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { getBackgroundGradient } from "@follow/utils/color"
import { zodResolver } from "@hookform/resolvers/zod"
import { repository } from "@pkg"
import { useMutation } from "@tanstack/react-query"
import { produce } from "immer"
import { atom, useAtomValue, useStore } from "jotai"
import { m } from "motion/react"
import type { ChangeEvent, FC } from "react"
import { memo, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { smoothPreset } from "~/components/ui/constants/spring"
import { Media } from "~/components/ui/media"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { apiClient } from "~/lib/api-fetch"
import { UrlBuilder } from "~/lib/url-builder"

import { FollowSummary } from "../feed/feed-summary"
import { FeedForm } from "./feed-form"

const formSchema = z.object({
  keyword: z.string().min(1),
  target: z.enum(["feeds", "lists"]),
})

const numberFormatter = new Intl.NumberFormat("en-US", {})

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
export function DiscoverForm({ type = "search" }: { type?: string }) {
  const { prefix, default: defaultValue } = info[type]!
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: defaultValue || "",
      target: "feeds",
    },
  })
  const { t } = useTranslation()

  const jotaiStore = useStore()
  const mutation = useMutation({
    mutationFn: async ({ keyword, target }: { keyword: string; target: "feeds" | "lists" }) => {
      const { data } = await apiClient.discover.$post({
        json: {
          keyword: keyword.trim(),
          target,
        },
      })

      jotaiStore.set(discoverSearchDataAtom, data)

      return data
    },
  })
  const discoverSearchDataAtom = useState(() => atom<DiscoverSearchData>())[0]

  const discoverSearchData = useAtomValue(discoverSearchDataAtom)

  const { present, dismissAll } = useModalStack()

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (info[type]!.showModal) {
      const defaultView = getRouteParams().view
      present({
        title: t("feed_form.add_feed"),
        content: () => (
          <FeedForm
            url={values.keyword}
            defaultValues={{
              view: defaultView.toString(),
            }}
            onSuccess={dismissAll}
          />
        ),
      })
    } else {
      mutation.mutate(values)
    }
  }

  const handleKeywordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const trimmedKeyword = event.target.value.trimStart()
      if (!prefix) {
        form.setValue("keyword", trimmedKeyword, { shouldValidate: true })
        return
      }
      const isValidPrefix = prefix.find((p) => trimmedKeyword.startsWith(p))
      if (!isValidPrefix) {
        form.setValue("keyword", prefix[0]!)
        return
      }
      if (trimmedKeyword.startsWith(`${isValidPrefix}${isValidPrefix}`)) {
        form.setValue("keyword", trimmedKeyword.slice(isValidPrefix.length))
        return
      }
      form.setValue("keyword", trimmedKeyword)
    },
    [form, prefix],
  )

  const handleSuccess = useCallback(
    (item: DiscoverSearchData[number]) => {
      const currentData = jotaiStore.get(discoverSearchDataAtom)
      if (!currentData) return
      jotaiStore.set(
        discoverSearchDataAtom,
        produce(currentData, (draft) => {
          const sub = draft.find((i) => {
            if (item.feed) {
              return i.feed?.id === item.feed.id
            }
            if (item.list) {
              return i.list?.id === item.list.id
            }
            return false
          })
          if (!sub) return
          sub.isSubscribed = true
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
          const sub = draft.find(
            (i) => i.feed?.id === item.feed?.id || i.list?.id === item.list?.id,
          )
          if (!sub) return
          sub.isSubscribed = false
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
          className="w-full max-w-[540px] space-y-8"
          data-testid="discover-form"
        >
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-4">
                  {t(info[type]?.label!)}
                  {info[type]?.labelSuffix}
                </FormLabel>
                <FormControl>
                  <Input autoFocus {...field} onChange={handleKeywordChange} />
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
                <FormItem className="!mt-4 flex items-center justify-between">
                  <FormLabel>{t("discover.target.label")}</FormLabel>
                  <FormControl>
                    <div className="flex gap-4 text-sm">
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
                        <div className="relative flex h-7 items-stretch overflow-hidden rounded-lg bg-zinc-100/80 p-0.5 shadow-inner dark:bg-zinc-800/80">
                          <m.div
                            className="absolute left-0.5 top-0.5 z-0 h-6 rounded-md bg-white shadow-sm dark:bg-zinc-700"
                            initial={false}
                            animate={{
                              x: field.value === "lists" ? "calc(100% + 2px)" : 0,
                              width: "calc(50% - 4px)",
                            }}
                            transition={smoothPreset}
                          />
                          <button
                            type="button"
                            onClick={() => handleTargetChange("feeds")}
                            className={`relative z-10 min-w-[80px] rounded-md px-4 text-sm font-medium transition-colors duration-200 ${
                              field.value === "feeds"
                                ? "text-zinc-900 dark:text-white"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                          >
                            {t("discover.target.feeds")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTargetChange("lists")}
                            className={`relative z-10 min-w-[80px] rounded-md px-4 text-sm font-medium transition-colors duration-200 ${
                              field.value === "lists"
                                ? "text-zinc-900 dark:text-white"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            }`}
                          >
                            {t("discover.target.lists")}
                          </button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="center flex" data-testid="discover-form-actions">
            <Button disabled={!form.formState.isValid} type="submit" isLoading={mutation.isPending}>
              {info[type]!.showModal ? t("discover.preview") : t("words.search")}
            </Button>
          </div>
        </form>
      </Form>
      {mutation.isSuccess && (
        <div className="mt-8 w-full max-w-lg">
          <div className="mb-4 pl-7 text-sm text-zinc-500">
            {t("discover.search.results", { count: mutation.data?.length || 0 })}
          </div>
          <div className="space-y-6 text-sm">
            {discoverSearchData?.map((item) => (
              <SearchCard
                key={item.feed?.id || item.list?.id}
                item={item}
                onSuccess={handleSuccess}
                onUnSubscribed={handleUnSubscribed}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

const SearchCard: FC<{
  item: DiscoverSearchData[number]
  onSuccess: (item: DiscoverSearchData[number]) => void
  onUnSubscribed?: (item: DiscoverSearchData[number]) => void
}> = memo(({ item, onSuccess }) => {
  const follow = useFollow()
  const { t } = useTranslation()

  return (
    <Card
      data-feed-id={item.feed?.id || item.list?.id}
      className="select-text border border-zinc-200/50 bg-white/80 shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-lg dark:border-zinc-800/50 dark:bg-neutral-800/50"
    >
      <CardHeader className="pb-2">
        <FollowSummary className="max-w-[462px]" feed={item.feed || item.list!} docs={item.docs} />
      </CardHeader>
      {item.docs ? (
        <CardFooter className="pt-4">
          <a href={item.docs} target="_blank" rel="noreferrer">
            <Button className="rounded-full bg-zinc-900 px-6 text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-900">
              View Docs
            </Button>
          </a>
        </CardFooter>
      ) : (
        <>
          <CardContent className="px-6 py-0">
            {!!item.entries?.length && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {item.entries
                  .filter((e) => !!e)
                  .map((entry) => {
                    const assertEntry = entry
                    return (
                      <a
                        key={assertEntry.id}
                        href={assertEntry.url || void 0}
                        target="_blank"
                        className="group relative flex flex-col overflow-hidden rounded-lg bg-zinc-50/50 shadow-zinc-100 transition-all duration-200 hover:-translate-y-px hover:shadow-md dark:bg-zinc-800/50 dark:shadow-neutral-700/50"
                        rel="noreferrer"
                      >
                        <div className="aspect-[3/2] w-full overflow-hidden">
                          <FeedCardMediaThumbnail entry={assertEntry} />
                        </div>
                        <div className="flex flex-1 flex-col justify-between p-3">
                          {assertEntry.title ? (
                            <div className="line-clamp-2 text-xs font-medium leading-4 text-zinc-900 group-hover:text-black dark:text-zinc-200 dark:group-hover:text-white">
                              {assertEntry.title}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                              <i className="i-mgc-link-cute-re shrink-0 translate-y-px self-start text-[14px]" />
                              <span className="line-clamp-2 break-all">
                                {assertEntry.url || "Untitled"}
                              </span>
                            </div>
                          )}
                          <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <RelativeTime
                              date={assertEntry.publishedAt}
                              displayAbsoluteTimeAfterDay={Infinity}
                            />
                          </div>
                        </div>
                      </a>
                    )
                  })}
              </div>
            )}
          </CardContent>
          <CardFooter className="mt-4 flex justify-between gap-4 border-t border-zinc-100/80 py-3 dark:border-zinc-800/80">
            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <i className="i-mgc-user-3-cute-re" />

                <span>
                  {numberFormatter.format(item.subscriptionCount ?? 0)}{" "}
                  {t("feed.follower", { count: item.subscriptionCount ?? 0 })}
                </span>
              </div>
              {item.updatesPerWeek ? (
                <div className="flex items-center gap-1.5">
                  <i className="i-mgc-safety-certificate-cute-re" />
                  <span>{t("feed.entry_week", { count: item.updatesPerWeek ?? 0 })}</span>
                </div>
              ) : item.entries?.[0]?.publishedAt ? (
                <div className="flex items-center gap-1.5">
                  <i className="i-mgc-safe-alert-cute-re" />
                  <span>{t("feed.updated_at")}</span>
                  <RelativeTime
                    date={item.entries[0].publishedAt}
                    displayAbsoluteTimeAfterDay={Infinity}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                buttonClassName="rounded-lg px-3 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-white"
                onClick={() => {
                  if (!item.feed?.id) return
                  window.open(UrlBuilder.shareFeed(item.feed.id, 0), "_blank")
                }}
              >
                {t("discover.preview")}
              </Button>
              <Button
                variant={item.isSubscribed ? "outline" : undefined}
                disabled={item.isSubscribed}
                onClick={() => {
                  follow({
                    isList: !!item.list?.id,
                    id: item.list?.id,
                    url: item.feed?.url,
                    defaultValues: {
                      view: getRouteParams().view.toString(),
                    },
                    onSuccess() {
                      onSuccess(item)
                    },
                  })
                }}
                buttonClassName={`relative overflow-hidden rounded-lg text-sm font-medium transition-all duration-300 ${
                  item.isSubscribed
                    ? "border-zinc-200/80 text-zinc-400 dark:border-zinc-700/80"
                    : ""
                }`}
              >
                {item.isSubscribed ? t("feed.actions.followed") : t("feed.actions.follow")}
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  )
})

const FeedCardMediaThumbnail: FC<{
  entry: NonUndefined<DiscoverSearchData[number]["entries"]>[number]
}> = ({ entry }) => {
  const [, , , bgAccent, bgAccentLight] = getBackgroundGradient(
    entry.title || entry.url || "Untitled",
  )

  if (entry.media?.[0]) {
    return (
      <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
        <Media
          src={entry.media[0].url}
          type={entry.media[0].type}
          previewImageUrl={entry.media[0].preview_image_url}
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </div>
    )
  }

  return (
    <div className="relative size-full bg-zinc-100 dark:bg-zinc-800">
      <div
        className="absolute inset-0 transition-transform duration-200 group-hover:scale-[1.01]"
        style={{
          background: `linear-gradient(145deg, ${bgAccent}, ${bgAccentLight})`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        {entry.title ? (
          <div className="text-base font-medium text-white/90">
            {entry.title.slice(0, 1).toUpperCase()}
          </div>
        ) : (
          <i className="i-mingcute-news-line text-xl text-white/80" />
        )}
      </div>
      <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
    </div>
  )
}
