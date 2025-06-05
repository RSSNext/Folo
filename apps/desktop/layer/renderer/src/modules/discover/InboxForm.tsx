import { Logo } from "@follow/components/icons/logo.jsx"
import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardHeader } from "@follow/components/ui/card/index.jsx"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { env } from "@follow/shared/env.desktop"
import { useInboxById } from "@follow/store/inbox/hooks"
import { inboxSyncService } from "@follow/store/inbox/store"
import type { InboxModel } from "@follow/store/inbox/types"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"
import { createErrorToaster } from "~/lib/error-parser"
import { FollowSummary } from "~/modules/feed/feed-summary"

export const InboxForm: Component<{
  id?: string
  asWidget?: boolean
}> = ({ id, asWidget }) => {
  const inbox = useInboxById(id)

  const isSubscribed = true

  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        asWidget ? "mx-auto min-h-[210px] w-full max-w-[550px]" : "px-[18px] pb-[18px] pt-12",
      )}
    >
      {!asWidget && (
        <div className="mb-4 mt-2 flex items-center gap-2 text-[22px] font-bold">
          <Logo className="size-8" />
          {isSubscribed ? t("feed_form.update_follow") : t("feed_form.add_follow")}
        </div>
      )}
      <InboxInnerForm
        {...{
          inbox,
        }}
      />
    </div>
  )
}

const inboxHandleSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-z0-9_-]+$/)

const formSchema = z.object({
  handle: inboxHandleSchema,
  title: z.string(),
})

const InboxInnerForm = ({ inbox }: { inbox?: Nullable<InboxModel> }) => {
  const currentModal = useCurrentModal()

  const { t } = useTranslation()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      handle: inbox?.id,
      title: inbox?.title || "",
    },
  })

  const mutationCreate = useMutation({
    mutationFn: async ({ handle, title }: { handle: string; title: string }) => {
      await inboxSyncService.createInbox({
        handle,
        title,
      })
    },
    onSuccess: (_) => {
      toast.success(t("discover.inbox_create_success"))
    },
    onError: createErrorToaster(t("discover.inbox_create_error")),
  })

  const mutationChange = useMutation({
    mutationFn: async ({ handle, title }: { handle: string; title: string }) => {
      await inboxSyncService.updateInbox({
        handle,
        title,
      })
    },
    onSuccess: () => {
      toast.success(t("discover.inbox_update_success"))
    },
    onError: createErrorToaster(t("discover.inbox_update_error")),
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (inbox) {
      mutationChange.mutate({ handle: values.handle, title: values.title })
    } else {
      mutationCreate.mutate({ handle: values.handle, title: values.title })
    }
    currentModal.dismiss?.()
  }

  return (
    <div className="flex flex-1 flex-col gap-y-4">
      {inbox && (
        <Card>
          <CardHeader>
            <FollowSummary feed={inbox} />
          </CardHeader>
        </Card>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn("space-y-4")}
          data-testid="discover-form"
        >
          {!inbox && (
            <FormField
              control={form.control}
              name="handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("discover.inbox_handle")}</FormLabel>
                  <FormControl>
                    <div className={cn("flex w-64 items-center gap-2")}>
                      <Input autoFocus {...field} />
                      <span className="text-zinc-500">{env.VITE_INBOXES_EMAIL}</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("discover.inbox_title")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className={cn("center flex justify-end gap-4")} data-testid="discover-form-actions">
            <Button type="submit" isLoading={mutationCreate.isPending}>
              {t(inbox ? "discover.inbox_update" : "discover.inbox_create")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
