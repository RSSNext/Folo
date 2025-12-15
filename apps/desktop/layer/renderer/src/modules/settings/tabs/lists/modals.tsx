import { Avatar, AvatarImage } from "@follow/components/ui/avatar/index.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { Divider } from "@follow/components/ui/divider/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import { FeedViewType } from "@follow/constants"
import { getFeedById } from "@follow/store/feed/getter"
import { useFeedById } from "@follow/store/feed/hooks"
import { useListById } from "@follow/store/list/hooks"
import { listSyncServices } from "@follow/store/list/store"
import { useAllFeedSubscription } from "@follow/store/subscription/hooks"
import { isBizId } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import type { Suggestion } from "~/components/ui/auto-completion"
import { Autocomplete } from "~/components/ui/auto-completion"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { useAddFeedToFeedList, useRemoveFeedFromFeedList } from "~/hooks/biz/useFeedActions"
import { createErrorToaster } from "~/lib/error-parser"
import { UrlBuilder } from "~/lib/url-builder"
import { FeedCertification } from "~/modules/feed/feed-certification"
import { FeedIcon } from "~/modules/feed/feed-icon"
import { ViewSelectorRadioGroup } from "~/modules/shared/ViewSelectorRadioGroup"

const formSchema = z.object({
  view: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  image: z.string().optional(),
})

export const ListCreationModalContent = ({ id }: { id?: string }) => {
  const { dismiss } = useCurrentModal()
  const { t } = useTranslation(["settings", "common"])

  const list = useListById(id)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      view: list?.view.toString() || FeedViewType.Articles.toString(),
      title: list?.title || "",
      description: list?.description || "",
      image: list?.image || "",
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (id) {
        await listSyncServices.updateList({
          listId: id,
          list: {
            ...values,
            view: Number.parseInt(values.view),
          },
        })
      } else {
        await listSyncServices.createList({
          list: {
            ...values,
            view: Number.parseInt(values.view),
          },
        })
      }
    },
    onSuccess: (_) => {
      const isCreate = !id
      toast.success(t(isCreate ? "lists.created.success" : "lists.edit.success"))

      dismiss()
    },
    onError: createErrorToaster(id ? t("lists.edit.error") : t("lists.created.error")),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:w-[450px]">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <div>
                <FormLabel>
                  {t("lists.title")}
                  <sup className="ml-1 align-sub text-red-500">*</sup>
                </FormLabel>
              </div>
              <FormControl>
                <Input autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <div>
                <FormLabel>{t("lists.description")}</FormLabel>
              </div>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <div className="flex items-center gap-4">
              <FormItem className="w-full">
                <FormLabel>{t("lists.image")}</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Input {...field} />
                    {field.value && (
                      <Avatar className="size-9">
                        <AvatarImage src={field.value} />
                      </Avatar>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          )}
        />
        <FormField
          control={form.control}
          name="view"
          render={() => (
            <FormItem>
              <FormLabel>{t("lists.view")}</FormLabel>

              <ViewSelectorRadioGroup {...form.register("view")} />
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" isLoading={createMutation.isPending}>
            {id ? t("common:words.update") : t("common:words.create")}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export const ListFeedsModalContent = ({ id }: { id: string }) => {
  const list = useListById(id)
  const { t } = useTranslation("settings")

  const [feedSearchFor, setFeedSearchFor] = useState("")
  const selectedFeedIdRef = useRef<string | null>(undefined)
  const addMutation = useAddFeedToFeedList({
    onSuccess: () => {
      setFeedSearchFor("")
      selectedFeedIdRef.current = null
    },
  })

  const allFeeds = useAllFeedSubscription()
  const autocompleteSuggestions: Suggestion[] = useMemo(() => {
    return allFeeds
      .filter((feed) => !feed.feedId || !list?.feedIds?.includes(feed.feedId))
      .map((feed) => {
        const title = getFeedById(feed.feedId)?.title
        return {
          name: title || "",
          value: feed.feedId || "",
        }
      })
  }, [allFeeds, list?.feedIds])

  if (!list) return null
  return (
    <>
      <div className="flex items-center gap-2">
        <Autocomplete
          maxHeight={window.innerHeight < 600 ? 120 : 240}
          autoFocus
          value={feedSearchFor}
          searchKeys={["name"]}
          onSuggestionSelected={(e) => {
            selectedFeedIdRef.current = e?.value
            setFeedSearchFor(e?.name || "")
          }}
          onChange={(e) => {
            setFeedSearchFor(e.target.value)
          }}
          suggestions={autocompleteSuggestions}
        />
        <Button
          textClassName="whitespace-nowrap"
          onClick={() => {
            if (isBizId(feedSearchFor)) {
              addMutation.mutate({ feedId: feedSearchFor, listId: id })
              return
            }
            if (selectedFeedIdRef.current) {
              addMutation.mutate({ feedId: selectedFeedIdRef.current, listId: id })
            }
          }}
          isLoading={addMutation.isPending}
        >
          {t("lists.feeds.add.label")}
        </Button>
      </div>
      <Divider className="mt-8" />
      <ScrollArea.ScrollArea viewportClassName="max-h-[380px] w-[450px]">
        <Table className="mt-4">
          <TableHeader className="border-b">
            <TableRow className="[&_*]:!font-semibold">
              <TableHead size="sm" className="pl-8">
                {t("lists.feeds.title")}
              </TableHead>
              <TableHead className="w-20 text-center" size="sm">
                {t("lists.feeds.owner")}
              </TableHead>
              <TableHead className="w-20 text-center" size="sm">
                {t("lists.feeds.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="border-t-[12px] border-transparent">
            {list.feedIds?.map((feedId) => (
              <RowRender feedId={feedId} key={feedId} listId={id} />
            ))}
          </TableBody>
        </Table>
      </ScrollArea.ScrollArea>
    </>
  )
}

const RowRender = ({ feedId, listId }: { feedId: string; listId: string }) => {
  const feed = useFeedById(feedId)

  const removeMutation = useRemoveFeedFromFeedList()
  if (!feed) return null
  return (
    <TableRow key={feed.title} className="h-8">
      <TableCell size="sm">
        <a
          target="_blank"
          href={UrlBuilder.shareFeed(feed.id)}
          className="flex items-center gap-2 font-semibold"
        >
          {feed.siteUrl && <FeedIcon noMargin siteUrl={feed.siteUrl} />}
          <span className="inline-block max-w-[200px] truncate">{feed.title}</span>
        </a>
      </TableCell>
      <TableCell align="center" size="sm">
        <div className="center">
          <FeedCertification className="ml-0" feed={feed} />
        </div>
      </TableCell>
      <TableCell align="center" size="sm">
        <Button variant="ghost" onClick={() => removeMutation.mutate({ feedId: feed.id, listId })}>
          <i className="i-mgc-delete-2-cute-re" />
        </Button>
      </TableCell>
    </TableRow>
  )
}
const categoryFormSchema = z.object({
  categoryName: z.string().min(1),
})
export const CategoryCreationModalContent = ({
  onSubmit,
}: {
  onSubmit: (category: string) => void
}) => {
  const { dismiss } = useCurrentModal()
  const { t } = useTranslation()

  const form = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      categoryName: "",
    },
  })

  const handleSubmit = form.handleSubmit(({ categoryName }) => {
    onSubmit(categoryName)
    dismiss()
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4 lg:w-[450px]">
        <FormField
          control={form.control}
          name="categoryName"
          render={({ field }) => (
            <FormItem>
              <div>
                <FormLabel>
                  {t("sidebar.feed_column.context_menu.new_category_modal.category_name")}
                  <sup className="ml-1 align-sub text-red-500">*</sup>
                </FormLabel>
              </div>
              <FormControl>
                <Input autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit">
            {t("sidebar.feed_column.context_menu.new_category_modal.create")}
          </Button>
        </div>
      </form>
    </Form>
  )
}
