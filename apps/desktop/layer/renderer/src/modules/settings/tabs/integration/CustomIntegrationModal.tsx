import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input, TextArea } from "@follow/components/ui/input/index.js"
import { KeyValueEditor } from "@follow/components/ui/key-value-editor/index.js"
import { ScrollArea } from "@follow/components/ui/scroll-area/index.js"
import { ResponsiveSelect } from "@follow/components/ui/select/responsive.js"
import type { CustomIntegration } from "@follow/shared/settings/interface"
import { nextFrame } from "@follow/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { CustomIntegrationPreview } from "~/modules/integration/CustomIntegrationPreview"
import { PlaceholderHelp } from "~/modules/integration/PlaceholderHelp"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  fetchTemplate: z.object({
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    url: z.string().min(1, "URL is required"),
    headers: z.record(z.string()),
    body: z.string().optional(),
  }),
  enabled: z.boolean(),
})

interface CustomIntegrationModalProps {
  integration?: CustomIntegration
  onSave: (integration: Omit<CustomIntegration, "id"> & { id?: string }) => void
}

const getCommonIcons = (t: any) =>
  [
    {
      value: "i-mgc-bookmark-cute-re",
      label: t("integration.custom_integrations.icons.bookmark"),
      icon: "i-mgc-bookmark-cute-re",
    },
    {
      value: "i-mgc-pic-cute-re",
      label: t("integration.custom_integrations.icons.picture"),
      icon: "i-mgc-pic-cute-re",
    },
    {
      value: "i-mgc-share-forward-cute-re",
      label: t("integration.custom_integrations.icons.share"),
      icon: "i-mgc-share-forward-cute-re",
    },
    {
      value: "i-mgc-external-link-cute-re",
      label: t("integration.custom_integrations.icons.external_link"),
      icon: "i-mgc-external-link-cute-re",
    },
    {
      value: "i-mgc-save-cute-re",
      label: t("integration.custom_integrations.icons.save"),
      icon: "i-mgc-save-cute-re",
    },
    {
      value: "i-mgc-documents-cute-re",
      label: t("integration.custom_integrations.icons.document"),
      icon: "i-mgc-documents-cute-re",
    },
    {
      value: "i-mgc-link-cute-re",
      label: t("integration.custom_integrations.icons.link"),
      icon: "i-mgc-link-cute-re",
    },
    {
      value: "i-mgc-star-cute-re",
      label: t("integration.custom_integrations.icons.star"),
      icon: "i-mgc-star-cute-re",
    },
    {
      value: "i-mgc-download-2-cute-re",
      label: t("integration.custom_integrations.icons.download"),
      icon: "i-mgc-download-2-cute-re",
    },
    {
      value: "i-mgc-send-plane-cute-re",
      label: t("integration.custom_integrations.icons.send"),
      icon: "i-mgc-send-plane-cute-re",
    },
  ] as const

export const CustomIntegrationModalContent = ({
  integration,
  onSave,
}: CustomIntegrationModalProps) => {
  const { dismiss } = useCurrentModal()
  const { t } = useTranslation("settings")
  const commonIcons = getCommonIcons(t)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: integration?.name || "",
      icon: integration?.icon || getCommonIcons(() => "")[0].value,
      fetchTemplate: integration?.fetchTemplate || {
        method: "GET",
        url: "",
        headers: {},
        body: "",
      },
      enabled: integration?.enabled ?? true,
    },
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      onSave({
        id: integration?.id,
        ...values,
      })
      toast.success(
        integration
          ? t("integration.custom_integrations.edit.success")
          : t("integration.custom_integrations.create.success"),
      )
      dismiss()
    } catch {
      toast.error(
        integration
          ? t("integration.custom_integrations.edit.error")
          : t("integration.custom_integrations.create.error"),
      )
    }
  }

  const selectedMethod = form.watch("fetchTemplate.method")
  const showBodyField = selectedMethod && ["POST", "PUT", "PATCH"].includes(selectedMethod)

  // Watch the entire fetchTemplate for preview
  const watchedFetchTemplate = form.watch("fetchTemplate")

  useEffect(() => {
    nextFrame(() => {
      form.setFocus("name")
    })
  }, [])

  return (
    <div className="flex max-h-[80vh] w-[500px] flex-col">
      {/* Static Header */}

      {/* Scrollable Content */}
      <div className="relative -mx-4 flex h-0 flex-1">
        <ScrollArea.ScrollArea flex rootClassName="flex-1" viewportClassName="px-4">
          <div className="shrink-0 space-y-2 pb-4">
            <p className="text-text-secondary text-sm">
              {t("integration.custom_integrations.modal.description")}
            </p>
            <PlaceholderHelp />
          </div>

          <div className="pr-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.name.label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("integration.custom_integrations.form.name.placeholder")}
                          {...field}
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.icon.label")}
                      </FormLabel>
                      <FormControl>
                        <ResponsiveSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          items={commonIcons.map((icon) => ({
                            label: icon.label,
                            value: icon.value,
                          }))}
                          renderItem={(item) => (
                            <div className="flex items-center gap-2">
                              <i className={item.value} />
                              {item.label}
                            </div>
                          )}
                        />
                      </FormControl>
                      <FormDescription className="pl-2.5">
                        {t("integration.custom_integrations.form.icon.description")}
                      </FormDescription>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                {/* HTTP Method */}
                <FormField
                  control={form.control}
                  name="fetchTemplate.method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.method.label")}
                      </FormLabel>
                      <FormControl>
                        <ResponsiveSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          items={["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => ({
                            label: method,
                            value: method,
                          }))}
                        />
                      </FormControl>
                      <FormDescription className="pl-2.5">
                        {t("integration.custom_integrations.form.method.description")}
                      </FormDescription>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                {/* URL */}
                <FormField
                  control={form.control}
                  name="fetchTemplate.url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.url.label")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("integration.custom_integrations.form.url.placeholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="pl-2.5">
                        {t("integration.custom_integrations.form.url.description")}
                      </FormDescription>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                {/* Headers */}
                <FormField
                  control={form.control}
                  name="fetchTemplate.headers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.headers.label")}
                      </FormLabel>
                      <FormControl>
                        <KeyValueEditor
                          value={field.value}
                          onChange={field.onChange}
                          keyPlaceholder={t(
                            "integration.custom_integrations.form.headers.key_placeholder",
                          )}
                          valuePlaceholder={t(
                            "integration.custom_integrations.form.headers.value_placeholder",
                          )}
                          addButtonText={t("integration.custom_integrations.form.headers.add")}
                        />
                      </FormControl>
                      <FormDescription className="pl-2.5">
                        {t("integration.custom_integrations.form.headers.description")}
                      </FormDescription>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                {/* Request Body (conditional) */}
                {showBodyField && (
                  <FormField
                    control={form.control}
                    name="fetchTemplate.body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="pl-2.5">
                          {t("integration.custom_integrations.form.body.label")}
                        </FormLabel>
                        <FormControl>
                          <TextArea
                            placeholder={t("integration.custom_integrations.form.body.placeholder")}
                            className="resize-none p-2.5 font-mono text-sm"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="pl-2.5">
                          {t("integration.custom_integrations.form.body.description")}
                        </FormDescription>
                        <FormMessage className="pl-2.5" />
                      </FormItem>
                    )}
                  />
                )}

                {/* Template Preview */}
                {watchedFetchTemplate.url && (
                  <CustomIntegrationPreview
                    fetchTemplate={watchedFetchTemplate}
                    className="border-t pt-4"
                  />
                )}
              </form>
            </Form>
          </div>
        </ScrollArea.ScrollArea>
      </div>

      {/* Static Footer */}
      <div className="border-fill-secondary mt-4 flex shrink-0 justify-end gap-2 border-t pt-4">
        <Button variant="outline" type="button" onClick={dismiss}>
          {t("words.cancel", { ns: "common" })}
        </Button>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
        >
          {integration ? t("words.save", { ns: "common" }) : t("words.create", { ns: "common" })}
        </Button>
      </div>
    </div>
  )
}
