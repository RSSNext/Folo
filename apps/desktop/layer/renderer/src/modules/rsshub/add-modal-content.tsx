import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/Input.js"
import { LoadingCircle } from "@follow/components/ui/loading/index.jsx"
import type { RSSHubModel } from "@follow/models"
import { whoami } from "@follow/store/user/getters"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { ShikiHighLighter } from "~/components/ui/code-highlighter"
import { useShikiDefaultTheme } from "~/components/ui/code-highlighter/shiki/hooks"
import { useAuthQuery } from "~/hooks/common"
import { Queries } from "~/queries"
import { useAddRSSHubMutation } from "~/queries/rsshub"

export function AddModalContent({
  dismiss,
  instance,
}: {
  dismiss: () => void
  instance?: RSSHubModel
}) {
  const { t } = useTranslation("settings")
  const addRSSHubMutation = useAddRSSHubMutation()
  const shikiTheme = useShikiDefaultTheme()
  const me = whoami()
  const details = useAuthQuery(Queries.rsshub.get({ id: instance?.id || "" }), {
    enabled: !!instance?.id,
  })

  const formSchema = z.object({
    baseUrl: z.string().url(),
    accessKey: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    addRSSHubMutation.mutate({ ...data, id: instance?.id })
  }

  useEffect(() => {
    if (addRSSHubMutation.isSuccess) {
      dismiss()
    }
  }, [addRSSHubMutation.isSuccess])

  useEffect(() => {
    if (details.data?.instance.baseUrl) {
      form.reset({
        baseUrl: details.data.instance.baseUrl,
        accessKey: details.data.instance.accessKey || undefined,
      })
    }
  }, [details.data])

  const codes = [
    `FOLLOW_OWNER_USER_ID=${me?.handle || me?.id}      # User id or handle of your follow account`,
    `FOLLOW_DESCRIPTION=${instance?.description || `${me?.name}'s instance`} # The description of your instance`,
    `FOLLOW_PRICE=${instance?.price || 100}                 # The monthly price of your instance, set to 0 means free.`,
    `FOLLOW_USER_LIMIT=${instance?.userLimit || 1000}           # The user limit of your instance, set it to 0 or 1 can make your instance private, leaving it empty means no restriction`,
  ]

  return (
    <div className="max-w-[550px] space-y-4 lg:min-w-[550px]">
      <div className="text-sm">{t("rsshub.addModal.description")}</div>

      <ShikiHighLighter
        transparent
        theme={shikiTheme}
        className="group mt-3 cursor-auto select-text whitespace-pre break-words rounded-lg bg-zinc-100 text-sm dark:bg-neutral-800 [&_pre]:whitespace-pre [&_pre]:break-words"
        code={codes.join("\n")}
        language="dotenv"
      />
      {details.isLoading ? (
        <div className="center mt-12 flex w-full flex-col gap-8">
          <LoadingCircle size="large" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("rsshub.addModal.base_url_label")}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accessKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("rsshub.addModal.access_key_label")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-end">
              <Button type="submit" isLoading={addRSSHubMutation.isPending}>
                {t("rsshub.addModal.add")}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
