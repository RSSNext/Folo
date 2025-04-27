import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent, CardHeader } from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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

export function DiscoverImport({ isInit = false }: { isInit?: boolean }) {
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
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-material-ultra-thin w-full max-w-[540px] space-y-8 rounded-lg border p-5 shadow-sm"
        >
          <FormField
            control={form.control}
            name="file"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>
                  {isInit ? t("discover.import.new_import_opml") : t("discover.import.opml")}
                </FormLabel>
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
    </>
  )
}
