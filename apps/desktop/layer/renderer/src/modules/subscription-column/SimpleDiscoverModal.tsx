import { Button } from "@follow/components/ui/button/index.js"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { atom, useAtomValue, useStore } from "jotai"
import type { ChangeEvent } from "react"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { z } from "zod"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { apiClient } from "~/lib/api-fetch"

import { DiscoverFeedCard } from "../discover/DiscoverFeedCard"
import { FeedForm } from "../discover/FeedForm"

const formSchema = z.object({
  keyword: z.string().min(1),
  type: z.enum(["search", "rss", "rsshub"]),
})

type DiscoverSearchData = Awaited<ReturnType<typeof apiClient.discover.$post>>["data"]

const typeConfig = {
  search: {
    label: "discover.any_url_or_keyword",
    placeholder: "Enter keywords or URL...",
    prefix: [] as string[],
    default: undefined,
  },
  rss: {
    label: "discover.rss_url",
    placeholder: "https://example.com/feed.xml",
    prefix: ["https://", "http://"],
    default: "https://",
  },
  rsshub: {
    label: "discover.rss_hub_route",
    placeholder: "rsshub://github/issue/follow/follow",
    prefix: ["rsshub://"],
    default: "rsshub://",
  },
} as const

export function SimpleDiscoverModal({ dismiss }: { dismiss: () => void }) {
  const { t } = useTranslation()
  const { present } = useModalStack()
  const jotaiStore = useStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keyword: "",
      type: "search",
    },
  })

  const watchedType = form.watch("type")
  const currentConfig = typeConfig[watchedType]

  const discoverSearchDataAtom = useState(() => atom<DiscoverSearchData>())[0]
  const discoverSearchData = useAtomValue(discoverSearchDataAtom)

  const mutation = useMutation({
    mutationFn: async ({ keyword, type }: { keyword: string; type: string }) => {
      // For RSS/RSSHub, show feed form modal
      if (type === "rss" || type === "rsshub") {
        present({
          title: t("feed_form.add_feed"),
          content: ({ dismiss: dismissFeedForm }) => (
            <FeedForm
              url={keyword}
              onSuccess={() => {
                dismissFeedForm()
                dismiss()
              }}
            />
          ),
        })
        return []
      }

      // For search, use discover API
      const { data } = await apiClient.discover.$post({
        json: {
          keyword: keyword.trim(),
          target: "feeds",
        },
      })

      jotaiStore.set(discoverSearchDataAtom, data)
      return data
    },
  })

  const handleKeywordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const trimmedKeyword = event.target.value.trimStart()
      const { prefix } = currentConfig

      if (!prefix || prefix.length === 0) {
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
    [form, currentConfig],
  )

  const handleTypeChange = useCallback(
    (value: string) => {
      form.setValue("type", value as any)
      const newConfig = typeConfig[value as keyof typeof typeConfig]
      if (newConfig.default) {
        form.setValue("keyword", newConfig.default)
      } else {
        form.setValue("keyword", "")
      }
    },
    [form],
  )

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values)
  }

  return (
    <div className="flex min-h-[400px] w-[600px] flex-col">
      <div className="mb-6">
        <p className="text-text-secondary text-sm">
          {t("discover.find_feeds_description", "Find and add new feeds to your collection")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Type Selector */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="relative">
                <FormControl>
                  <SegmentGroup value={field.value} onValueChanged={handleTypeChange}>
                    <SegmentItem value="search" label={t("words.search")} />
                    <SegmentItem value="rss" label={t("words.rss")} />
                    <SegmentItem value="rsshub" label={t("words.rsshub")} />
                  </SegmentGroup>
                </FormControl>
                <div className="text-text-secondary absolute bottom-0 right-0 flex flex-col flex-wrap items-end gap-1 text-sm">
                  <div>
                    Or go to{" "}
                    <Link className="text-accent underline" to="/discover" onClick={dismiss}>
                      Discover
                    </Link>
                    <i className="i-mgc-arrow-right-up-cute-re" />
                  </div>

                  <p>to find more interesting contents.</p>
                </div>
              </FormItem>
            )}
          />

          {/* Input Field */}
          <FormField
            control={form.control}
            name="keyword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t(currentConfig.label)}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={currentConfig.placeholder}
                    {...field}
                    onChange={handleKeywordChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={dismiss}>
              {t("words.cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? t("words.searching", "Searching...") : t("words.search")}
            </Button>
          </div>
        </form>
      </Form>

      {/* Search Results */}
      {discoverSearchData && discoverSearchData.length > 0 && (
        <div className="mt-6 flex-1">
          <div className="border-border mb-4 border-b pb-2">
            <h3 className="text-text font-medium">
              {t("discover.search_results", "Search Results")} ({discoverSearchData.length})
            </h3>
          </div>
          <div className="max-h-[300px] space-y-3 overflow-y-auto">
            {discoverSearchData.map((item, index) => (
              <DiscoverFeedCard key={index} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {mutation.isSuccess && discoverSearchData && discoverSearchData.length === 0 && (
        <div className="mt-6 flex flex-1 items-center justify-center">
          <div className="text-text-secondary text-center">
            <i className="i-mgc-search-3-cute-re mb-2 text-2xl" />
            <p>{t("discover.no_results", "No feeds found for your search.")}</p>
          </div>
        </div>
      )}
    </div>
  )
}
