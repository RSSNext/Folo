import { Button } from "@follow/components/ui/button/index.js"
import { CollapseCss, CollapseCssGroup } from "@follow/components/ui/collapse/index.js"
import { DropZone } from "@follow/components/ui/drop-zone/index.js"
import { Form, FormControl, FormField, FormItem } from "@follow/components/ui/form/index.jsx"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Fragment } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { z } from "zod"

import { Media } from "~/components/ui/media/Media"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { followClient } from "~/lib/api-client"
import { toastFetchError } from "~/lib/error-parser"

import { OpmlSelectionModal } from "./OpmlSelectionModal"

const parseOpmlFile = async (file: File) => {
  const data = await followClient.api.subscriptions.parseOpml(await file.arrayBuffer())

  return data.data
}

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

export function DiscoverImport() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const { present } = useModalStack()

  const parseOpmlMutation = useMutation({
    mutationFn: parseOpmlFile,
    async onError(err) {
      toastFetchError(err)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    parseOpmlMutation.mutate(values.file, {
      onSuccess: (parsedData) => {
        present({
          title: t("discover.import.preview_opml_content"),
          content: () => <OpmlSelectionModal file={values.file} parsedData={parsedData} />,
          clickOutsideToDismiss: false,
          modalClassName: "max-w-2xl w-full h-[80vh]",
          modalContentClassName: "flex flex-col h-full",
        })
      },
    })
  }

  const { t } = useTranslation()

  return (
    <div className="flex flex-col">
      <div className="mb-2 font-medium">1. {t("discover.import.opml_step1")}</div>
      <div className="mb-6 w-[500px]">
        <CollapseCssGroup defaultOpenId="inoreader">
          <CollapseCss
            collapseId="inoreader"
            title={
              <div className="flex h-14 items-center justify-normal gap-2 border-border font-medium">
                <Media
                  className="size-5"
                  src="https://inoreader.com/favicon.ico"
                  alt="inoreader"
                  type="photo"
                />
                {t("discover.import.opml_step1_inoreader")}
                <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
              </div>
            }
            contentClassName="flex flex-col gap-1"
            innerClassName="p-4"
          >
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
          </CollapseCss>
          <CollapseCss
            collapseId="feedly"
            title={
              <div className="flex h-14 items-center justify-normal gap-2 border-border font-medium">
                <Media
                  className="size-5"
                  src="https://feedly.com/favicon.ico"
                  alt="feedly"
                  type="photo"
                />
                {t("discover.import.opml_step1_feedly")}
                <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
              </div>
            }
            contentClassName="flex flex-col gap-1"
            innerClassName="p-4"
          >
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
          </CollapseCss>
          <CollapseCss
            collapseId="other"
            title={
              <div className="flex h-14 items-center justify-normal gap-2 border-border font-medium">
                <i className="i-mgc-rss-cute-fi ml-[-0.14rem] size-6 text-orange-500" />
                {t("discover.import.opml_step1_other")}
                <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
              </div>
            }
            contentClassName="flex flex-col gap-1"
            className="border-b-0"
            innerClassName="p-4"
          >
            {t("discover.import.opml_step1_other_step1")}
          </CollapseCss>
        </CollapseCssGroup>
      </div>

      <div className="mb-4 font-medium">2. {t("discover.import.opml_step2")}</div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-[540px] space-y-8">
          <FormField
            control={form.control}
            name="file"
            render={({ field: { value, onChange } }) => (
              <FormItem>
                <FormControl>
                  <DropZone
                    id="upload-file"
                    accept=".opml,.xml"
                    onDrop={(fileList) => onChange(fileList[0])}
                  >
                    {form.formState.dirtyFields.file ? (
                      <Fragment>
                        <i className="i-mgc-file-upload-cute-re size-5" />
                        <span className="ml-2 text-sm font-semibold opacity-80">{value.name}</span>
                      </Fragment>
                    ) : (
                      <Fragment>
                        <i className="i-mgc-file-upload-cute-re size-10 text-text-tertiary" />
                        <span className="ml-2 text-title2 text-text-tertiary">
                          {t("discover.import.click_to_upload")}
                        </span>
                      </Fragment>
                    )}
                  </DropZone>
                </FormControl>
              </FormItem>
            )}
          />
          <div className="center flex">
            <Button
              type="submit"
              disabled={!form.formState.dirtyFields.file}
              isLoading={parseOpmlMutation.isPending}
            >
              {t("words.import")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
