import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@follow/components/ui/accordion/index.js"
import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Fragment } from "react/jsx-runtime"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { z } from "zod"

import { DropZone } from "~/components/ui/drop-zone"
import { Media } from "~/components/ui/media"
import { apiFetch } from "~/lib/api-fetch"
import { toastFetchError } from "~/lib/error-parser"
import { Queries } from "~/queries"

import { FollowSummary } from "../feed/feed-summary"

type FeedResponseList = {
  id: string
  url: string
  title: string | null
}[]

const formSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size < 500_000, {
      message: "Your OPML file must be less than 500KB.",
    })
    .refine((file) => file.name.endsWith(".opml") || file.name.endsWith(".xml"), {
      message: "Your OPML file must be in OPML or XML format.",
    }),
})

const NumberDisplay = ({ value }) => <span className="font-bold text-zinc-800">{value ?? 0}</span>

const list: {
  key: string
  title: I18nKeys
  className: string
}[] = [
  {
    key: "parsedErrorItems",
    title: "discover.import.parsedErrorItems",
    className: "text-red-500",
  },
  {
    key: "successfulItems",
    title: "discover.import.successfulItems",
    className: "text-green-500",
  },
  {
    key: "conflictItems",
    title: "discover.import.conflictItems",
    className: "text-yellow-500",
  },
]

export function DiscoverImport() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      // FIXME: if post data is form data, hono hc not support this.

      const { data } = await apiFetch<{
        data: {
          successfulItems: FeedResponseList
          conflictItems: FeedResponseList
          parsedErrorItems: FeedResponseList
        }
      }>("/subscriptions/import", {
        method: "POST",
        body: formData,
      })

      return data
    },
    onSuccess: () => {
      Queries.subscription.all().invalidateRoot()
    },
    async onError(err) {
      toastFetchError(err)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values.file)
  }

  const { t } = useTranslation()

  return (
    <div className="flex flex-col">
      <div className="mb-2 font-medium">1. {t("discover.import.opml_step1")}</div>
      <Accordion type="single" collapsible className="mb-6 w-[500px]">
        <AccordionItem value="inoreader">
          <AccordionTrigger className="justify-normal gap-2 hover:no-underline">
            <Media
              className="size-5"
              src="https://inoreader.com/favicon.ico"
              alt="inoreader"
              type="photo"
            />
            {t("discover.import.opml_step1_inoreader")}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <p>
              <Trans
                ns="app"
                i18nKey="discover.import.opml_step1_inoreader_step1"
                components={{
                  Link: (
                    <a
                      href="https://www.inoreader.com/preferences/content"
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      inoreader.com/preferences/content
                    </a>
                  ),
                }}
              />
            </p>
            <p>{t("discover.import.opml_step1_inoreader_step2")}</p>
            <p>{t("discover.import.opml_step1_inoreader_step3")}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="feedly">
          <AccordionTrigger className="justify-normal gap-2 hover:no-underline">
            <Media
              className="size-5"
              src="https://feedly.com/favicon.ico"
              alt="feedly"
              type="photo"
            />
            {t("discover.import.opml_step1_feedly")}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            <p>
              <Trans
                ns="app"
                i18nKey="discover.import.opml_step1_feedly_step1"
                components={{
                  Link: (
                    <a
                      href="https://feedly.com/i/opml"
                      className="underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      feedly.com/i/opml
                    </a>
                  ),
                }}
              />
            </p>
            <p>{t("discover.import.opml_step1_feedly_step2")}</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="other" className="border-b-0">
          <AccordionTrigger className="justify-normal gap-2 hover:no-underline">
            <i className="i-mgc-rss-cute-fi -ml-[0.14rem] size-6 text-orange-500" />
            {t("discover.import.opml_step1_other")}
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-1">
            {t("discover.import.opml_step1_other_step1")}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mb-4 font-medium">2. {t("discover.import.opml_step2")}</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-[540px] space-y-8">
          <FormField
            control={form.control}
            name="file"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormControl>
                  <DropZone onDrop={(fileList) => onChange(fileList[0])}>
                    {form.formState.dirtyFields.file ? (
                      <Fragment>
                        <i className="i-mgc-file-upload-cute-re size-5" />
                        <span className="ml-2 text-sm font-semibold opacity-80">{value.name}</span>
                      </Fragment>
                    ) : (
                      <Fragment>
                        <i className="i-mgc-file-upload-cute-re text-text-tertiary size-10" />
                        <span className="text-title2 text-text-tertiary ml-2">
                          {t("discover.import.click_to_upload")}
                        </span>
                      </Fragment>
                    )}
                  </DropZone>
                </FormControl>
                <Input
                  {...fieldProps}
                  id="upload-file"
                  type="file"
                  accept=".opml,.xml"
                  className="hidden"
                  onChange={(event) => onChange(event.target.files && event.target.files[0])}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="center flex">
            <Button
              type="submit"
              disabled={!form.formState.dirtyFields.file}
              isLoading={mutation.isPending}
            >
              {t("words.import")}
            </Button>
          </div>
        </form>
      </Form>
      {mutation.isSuccess && (
        <div className="mt-8 w-full max-w-lg">
          <Card>
            <CardHeader className="block text-zinc-500">
              <Trans
                ns="app"
                i18nKey="discover.import.result"
                components={{
                  SuccessfulNum: <NumberDisplay value={mutation.data?.successfulItems.length} />,
                  ConflictNum: <NumberDisplay value={mutation.data?.conflictItems.length} />,
                  ErrorNum: <NumberDisplay value={mutation.data?.parsedErrorItems.length} />,
                }}
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {list.map((item) => (
                <div key={item.key}>
                  <div className={cn("mb-4 text-lg font-medium", item.className)}>
                    {t(item.title)}
                  </div>
                  <div className="space-y-4">
                    {!mutation.data?.[item.key].length && (
                      <div className="text-zinc-500">{t("discover.import.noItems")}</div>
                    )}
                    {mutation.data?.[item.key].map((feed) => (
                      <FollowSummary className="max-w-[462px]" key={feed.id} feed={feed} />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
