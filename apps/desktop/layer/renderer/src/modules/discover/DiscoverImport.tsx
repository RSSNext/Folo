import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@follow/components/ui/accordion/index.js"
import { Button } from "@follow/components/ui/button/index.js"
import { DropZone } from "@follow/components/ui/drop-zone/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import type { BizRespose } from "@follow/models"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Fragment } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { z } from "zod"

import { Media } from "~/components/ui/media/Media"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { apiFetch } from "~/lib/api-fetch"
import { toastFetchError } from "~/lib/error-parser"

import { OpmlSelectionModal } from "./OpmlSelectionModal"
import type { ParsedOpmlData } from "./types"

const parseOpmlFile = async (file: File): Promise<ParsedOpmlData> => {
  const formData = new FormData()
  formData.append("file", file)

  const data = await apiFetch<BizRespose<ParsedOpmlData>>("/subscriptions/parse-opml", {
    method: "POST",
    body: formData,
  })

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
            <i className="i-mgc-rss-cute-fi ml-[-0.14rem] size-6 text-orange-500" />
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
