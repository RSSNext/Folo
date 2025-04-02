import { useMobile } from "@follow/components/hooks/useMobile.js"
import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent, CardFooter, CardHeader } from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { Radio } from "@follow/components/ui/radio-group/index.js"
import { RadioGroup } from "@follow/components/ui/radio-group/RadioGroup.jsx"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import { getBackgroundGradient } from "@follow/utils/color"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { produce } from "immer"
import { atom, useAtomValue, useStore } from "jotai"
import type { ChangeEvent, FC } from "react"
import { memo, useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Media } from "~/components/ui/media"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useFollow } from "~/hooks/biz/useFollow"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { apiClient } from "~/lib/api-fetch"

import { FollowSummary } from "../feed/feed-summary"
import { FeedForm } from "./feed-form"

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
  },
  rsshub: {
    label: "discover.rss_hub_route",
    prefix: ["rsshub://"],
    default: "rsshub://",
    showModal: true,
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
                <FormLabel>{t(info[type]?.label!)}</FormLabel>
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
                        <RadioGroup
                          className="flex items-center"
                          value={field.value}
                          onValueChange={handleTargetChange}
                        >
                          <Radio label={t("discover.target.feeds")} value="feeds" />
                          <Radio label={t("discover.target.lists")} value="lists" />
                        </RadioGroup>
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
          <div className="mb-4 text-zinc-500">
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
    <Card data-feed-id={item.feed?.id || item.list?.id} className="select-text">
      <CardHeader>
        <FollowSummary className="max-w-[462px]" feed={item.feed || item.list!} docs={item.docs} />
      </CardHeader>
      {item.docs ? (
        <CardFooter>
          <a href={item.docs} target="_blank" rel="noreferrer">
            <Button>View Docs</Button>
          </a>
        </CardFooter>
      ) : (
        <>
          <CardContent>
            {!!item.entries?.length && (
              <div className="grid grid-cols-4 gap-4">
                {item.entries
                  .filter((e) => !!e)
                  .map((entry) => {
                    const assertEntry = entry
                    return (
                      <a
                        key={assertEntry.id}
                        href={assertEntry.url || void 0}
                        target="_blank"
                        className="flex min-w-0 flex-1 flex-col items-center gap-1"
                        rel="noreferrer"
                      >
                        <FeedCardMediaThumbnail entry={assertEntry} />
                        <div className="line-clamp-2 w-full text-xs leading-tight">
                          {assertEntry.title}
                        </div>
                      </a>
                    )
                  })}
              </div>
            )}
          </CardContent>
          <CardFooter>
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
            >
              {item.isSubscribed ? t("feed.actions.followed") : t("feed.actions.follow")}
            </Button>
            <div className="ml-6 text-zinc-500">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {item.subscriptionCount ?? 0}
              </span>{" "}
              {t("feed.follower", { count: item.subscriptionCount })}
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
  const [, , , bgAccent, bgAccentLight, bgAccentUltraLight] = getBackgroundGradient(entry.title)
  return entry.media?.[0] ? (
    <Media
      src={entry.media?.[0].url}
      type={entry.media?.[0].type}
      previewImageUrl={entry.media?.[0].preview_image_url}
      className="aspect-square w-full"
    />
  ) : (
    <div
      className="relative flex aspect-square w-full items-end overflow-hidden rounded p-2 text-xs leading-tight text-zinc-900"
      style={{
        background: `linear-gradient(37deg, ${bgAccent} 27.82%, ${bgAccentLight} 79.68%, ${bgAccentUltraLight} 100%)`,
      }}
    >
      <div className="line-clamp-2 text-right font-medium">{entry.title}</div>
    </div>
  )
}
