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
import type {
  CustomIntegration,
  FetchTemplate,
  URLSchemeTemplate,
} from "@follow/shared/settings/interface"
import { nextFrame } from "@follow/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { memo, useCallback, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { CustomIntegrationPreview } from "~/modules/integration/CustomIntegrationPreview"
import { PlaceholderHelp } from "~/modules/integration/PlaceholderHelp"
import { URLSchemePreview } from "~/modules/integration/URLSchemePreview"

const httpTemplateSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().url("URL is required"),
  headers: z.record(z.string()),
  body: z.string().optional(),
})

const urlSchemeTemplateSchema = z.object({
  scheme: z.string().url("URL scheme is required"),
})

const createFormSchema = () =>
  z
    .object({
      name: z.string().min(1, "Name is required"),
      icon: z.string().min(1, "Icon is required"),
      type: z.enum(["http", "url-scheme"]),
      fetchTemplate: z.any().optional(),
      urlSchemeTemplate: z.any().optional(),
      enabled: z.boolean(),
    })
    .superRefine((data, ctx) => {
      try {
        if (data.type === "http") {
          httpTemplateSchema.parse(data.fetchTemplate)
        } else if (data.type === "url-scheme") {
          urlSchemeTemplateSchema.parse(data.urlSchemeTemplate)
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((zodError) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: zodError.message,
              path:
                data.type === "http"
                  ? ["fetchTemplate", ...zodError.path]
                  : ["urlSchemeTemplate", ...zodError.path],
            })
          })
        }
      }
    })

type FormData = z.infer<ReturnType<typeof createFormSchema>>

interface CustomIntegrationModalProps {
  integration?: CustomIntegration
  onSave: (integration: Omit<CustomIntegration, "id"> & { id?: string }) => void
}

// Constants
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const
const INTEGRATION_TYPES = [
  { value: "http", icon: "i-mgc-world-2-cute-re" },
  { value: "url-scheme", icon: "i-mgc-link-cute-re" },
] as const

const ICON_OPTIONS = [
  { value: "i-mgc-bookmark-cute-re", key: "bookmark" },
  { value: "i-mgc-pic-cute-re", key: "picture" },
  { value: "i-mgc-share-forward-cute-re", key: "share" },
  { value: "i-mgc-external-link-cute-re", key: "external_link" },
  { value: "i-mgc-save-cute-re", key: "save" },
  { value: "i-mgc-documents-cute-re", key: "document" },
  { value: "i-mgc-link-cute-re", key: "link" },
  { value: "i-mgc-star-cute-re", key: "star" },
  { value: "i-mgc-download-2-cute-re", key: "download" },
  { value: "i-mgc-send-plane-cute-re", key: "send" },
] as const

// Helper functions
const getDefaultFetchTemplate = (): FetchTemplate => ({
  method: "GET",
  url: "",
  headers: {},
  body: "",
})

const getDefaultURLSchemeTemplate = (): URLSchemeTemplate => ({
  scheme: "",
})

// Memoized icon selector component
const IconSelector = memo(
  ({
    value,
    onChange,
    icons,
  }: {
    value: string
    onChange: (value: string) => void
    icons: Array<{ value: string; label: string; icon: string }>
  }) => (
    <ResponsiveSelect
      value={value}
      onValueChange={onChange}
      items={icons.map((icon) => ({
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
  ),
)

// Memoized type selector component
const TypeSelector = memo(
  ({
    value,
    onChange,
    items,
    getTypeIcon,
  }: {
    value: string
    onChange: (value: string) => void
    items: Array<{ label: string; value: string }>
    getTypeIcon: (type: string) => string
  }) => (
    <ResponsiveSelect
      value={value}
      onValueChange={onChange}
      items={items}
      renderItem={(item) => (
        <div className="flex items-center gap-2">
          <i className={getTypeIcon(item.value)} />
          {item.label}
        </div>
      )}
    />
  ),
)

// Memoized method selector component
const MethodSelector = memo(
  ({
    value,
    onChange,
    items,
  }: {
    value: string
    onChange: (value: string) => void
    items: Array<{ label: string; value: string }>
  }) => <ResponsiveSelect value={value} onValueChange={onChange} items={items} />,
)

// Memoized input field component
const MemoizedInput = memo(Input)
const MemoizedTextArea = memo(TextArea)
const MemoizedKeyValueEditor = memo(KeyValueEditor)

export const CustomIntegrationModalContent = ({
  integration,
  onSave,
}: CustomIntegrationModalProps) => {
  const { dismiss } = useCurrentModal()
  const { t } = useTranslation("settings")

  const getCommonIcons = useCallback(
    () =>
      ICON_OPTIONS.map((icon) => ({
        value: icon.value,
        label: t(`integration.custom_integrations.icons.${icon.key}`),
        icon: icon.value,
      })),
    [t],
  )

  // Memoized values
  const commonIcons = useMemo(
    (): Array<{ value: string; label: string; icon: string }> => getCommonIcons(),
    [getCommonIcons],
  )

  const defaultValues = useMemo((): FormData => {
    const integrationType = (integration?.type as "http" | "url-scheme") || "http"

    return {
      name: integration?.name || "",
      icon: integration?.icon || commonIcons[0]?.value || ICON_OPTIONS[0].value,
      type: integrationType,

      fetchTemplate:
        integrationType === "http"
          ? integration?.fetchTemplate || getDefaultFetchTemplate()
          : getDefaultFetchTemplate(),

      urlSchemeTemplate:
        integrationType === "url-scheme"
          ? integration?.urlSchemeTemplate || getDefaultURLSchemeTemplate()
          : getDefaultURLSchemeTemplate(),
      enabled: integration?.enabled ?? true,
    }
  }, [integration, commonIcons])

  const formSchema = useMemo(() => createFormSchema(), [])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = useCallback(
    (values: FormData) => {
      try {
        // Clean up data based on type - only include relevant template
        const cleanedValues = {
          id: integration?.id,
          name: values.name,
          icon: values.icon,
          type: values.type,
          enabled: values.enabled,
          ...(values.type === "http"
            ? { fetchTemplate: values.fetchTemplate }
            : { urlSchemeTemplate: values.urlSchemeTemplate }),
        }

        onSave(cleanedValues)
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
    },
    [onSave, integration, t, dismiss],
  )

  // Only watch essential fields for conditional rendering to minimize re-renders
  const selectedType = form.watch("type")
  const selectedMethod = form.watch("fetchTemplate.method") // Only watch method for body field display

  // Computed values with minimal dependencies
  const showBodyField = useMemo(
    () => selectedMethod && ["POST", "PUT", "PATCH"].includes(selectedMethod),
    [selectedMethod],
  )

  const shouldShowHTTPPreview = useMemo(() => selectedType === "http", [selectedType])

  const shouldShowURLSchemePreview = useMemo(() => selectedType === "url-scheme", [selectedType])

  // Get templates only when needed for preview
  const getWatchedFetchTemplate = useCallback(() => {
    if (!shouldShowHTTPPreview) return null
    const template = form.getValues("fetchTemplate")
    return template?.url ? template : null
  }, [form, shouldShowHTTPPreview])

  const getWatchedURLSchemeTemplate = useCallback(() => {
    if (!shouldShowURLSchemePreview) return null
    const template = form.getValues("urlSchemeTemplate")
    return template?.scheme ? template : null
  }, [form, shouldShowURLSchemePreview])

  // Event handlers
  const handleTypeChange = useCallback(
    (onChange: (value: string) => void) => (value: string) => {
      onChange(value)

      // Clear templates for the type we're switching away from
      if (value === "http") {
        form.setValue("urlSchemeTemplate", getDefaultURLSchemeTemplate())

        const currentFetchTemplate = form.getValues("fetchTemplate")
        if (!currentFetchTemplate?.url && !currentFetchTemplate?.method) {
          form.setValue("fetchTemplate", getDefaultFetchTemplate())
        }
      } else if (value === "url-scheme") {
        form.setValue("fetchTemplate", getDefaultFetchTemplate())

        const currentUrlSchemeTemplate = form.getValues("urlSchemeTemplate")
        if (!currentUrlSchemeTemplate?.scheme) {
          form.setValue("urlSchemeTemplate", getDefaultURLSchemeTemplate())
        }
      }

      // Clear any existing validation errors
      form.clearErrors()
    },
    [form],
  )

  // Memoized items
  const integrationTypeItems = useMemo(
    () => [
      {
        label: t("integration.custom_integrations.form.type.http"),
        value: "http" as const,
      },
      {
        label: t("integration.custom_integrations.form.type.url_scheme"),
        value: "url-scheme" as const,
      },
    ],
    [t],
  )

  const httpMethodItems = useMemo(
    () =>
      HTTP_METHODS.map((method) => ({
        label: method,
        value: method,
      })),
    [],
  )

  // Helper functions
  const getTypeIcon = (type: string) => {
    const typeConfig = INTEGRATION_TYPES.find((t) => t.value === type)
    return typeConfig?.icon || "i-mgc-world-2-cute-re"
  }

  useEffect(() => {
    nextFrame(() => {
      form.setFocus("name")
    })
  }, [form])

  return (
    <div className="flex max-h-[80vh] w-[500px] flex-col">
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.name.label")}
                      </FormLabel>
                      <FormControl>
                        <MemoizedInput
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
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.icon.label")}
                      </FormLabel>
                      <FormControl>
                        <IconSelector
                          value={field.value}
                          onChange={field.onChange}
                          icons={commonIcons}
                        />
                      </FormControl>
                      <FormDescription className="pl-2.5">
                        {t("integration.custom_integrations.form.icon.description")}
                      </FormDescription>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                {/* Integration Type */}
                <FormField
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="pl-2.5">
                        {t("integration.custom_integrations.form.type.label")}
                      </FormLabel>
                      <FormControl>
                        <TypeSelector
                          value={field.value}
                          onChange={handleTypeChange(field.onChange)}
                          items={integrationTypeItems}
                          getTypeIcon={getTypeIcon}
                        />
                      </FormControl>
                      <FormDescription className="pl-2.5">
                        {t("integration.custom_integrations.form.type.description")}
                      </FormDescription>
                      <FormMessage className="pl-2.5" />
                    </FormItem>
                  )}
                />

                {/* HTTP Fields */}
                {selectedType === "http" && (
                  <>
                    {/* HTTP Method */}
                    <FormField
                      name="fetchTemplate.method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="pl-2.5">
                            {t("integration.custom_integrations.form.method.label")}
                          </FormLabel>
                          <FormControl>
                            <MethodSelector
                              value={field.value}
                              onChange={field.onChange}
                              items={httpMethodItems}
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
                      name="fetchTemplate.url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="pl-2.5">
                            {t("integration.custom_integrations.form.url.label")}
                          </FormLabel>
                          <FormControl>
                            <MemoizedInput
                              placeholder={t(
                                "integration.custom_integrations.form.url.placeholder",
                              )}
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
                      name="fetchTemplate.headers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="pl-2.5">
                            {t("integration.custom_integrations.form.headers.label")}
                          </FormLabel>
                          <FormControl>
                            <MemoizedKeyValueEditor
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
                        name="fetchTemplate.body"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="pl-2.5">
                              {t("integration.custom_integrations.form.body.label")}
                            </FormLabel>
                            <FormControl>
                              <MemoizedTextArea
                                placeholder={t(
                                  "integration.custom_integrations.form.body.placeholder",
                                )}
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
                  </>
                )}

                {/* URL Scheme Fields */}
                {selectedType === "url-scheme" && (
                  <>
                    {/* URL Scheme */}
                    <FormField
                      name="urlSchemeTemplate.scheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="pl-2.5">
                            {t("integration.custom_integrations.form.scheme.label", "URL Scheme")}
                          </FormLabel>
                          <FormControl>
                            <MemoizedInput
                              placeholder={t(
                                "integration.custom_integrations.form.scheme.placeholder",
                                "e.g., obsidian://new?vault=MyVault&name=[title]&content=[content_markdown]",
                              )}
                              {...field}
                              className="font-mono text-sm"
                            />
                          </FormControl>
                          <FormDescription className="pl-2.5">
                            {t(
                              "integration.custom_integrations.form.scheme.description",
                              "Enter the URL scheme for the external application. Use placeholders like [title], [url], [content_markdown], etc.",
                            )}
                          </FormDescription>
                          <FormMessage className="pl-2.5" />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Template Preview */}
                {shouldShowHTTPPreview &&
                  (() => {
                    const template = getWatchedFetchTemplate()
                    return template ? (
                      <CustomIntegrationPreview
                        key="http-preview"
                        fetchTemplate={template}
                        className="border-t pt-4"
                      />
                    ) : null
                  })()}
                {shouldShowURLSchemePreview &&
                  (() => {
                    const template = getWatchedURLSchemeTemplate()
                    return template ? (
                      <URLSchemePreview
                        key="url-scheme-preview"
                        urlSchemeTemplate={template}
                        className="border-t pt-4"
                      />
                    ) : null
                  })()}
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
          type="button"
          disabled={form.formState.isSubmitting}
          onClick={form.handleSubmit(onSubmit)}
        >
          {integration ? t("words.save", { ns: "common" }) : t("words.create", { ns: "common" })}
        </Button>
      </div>
    </div>
  )
}
