import { Button } from "@follow/components/ui/button/index.js"
import { Card, CardContent } from "@follow/components/ui/card/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/Input.js"
import type { RSSHubModel } from "@follow/models"
import { whoami } from "@follow/store/user/getters"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { z } from "zod"

import { useAuthQuery } from "~/hooks/common"
import { UserAvatar } from "~/modules/user/UserAvatar"
import { Queries } from "~/queries"
import { useSetRSSHubMutation } from "~/queries/rsshub"

import { useTOTPModalWrapper } from "../profile/hooks"

export function SetModalContent({
  dismiss,
  instance,
}: {
  dismiss: () => void
  instance: RSSHubModel
}) {
  const { t } = useTranslation("settings")
  const setRSSHubMutation = useSetRSSHubMutation()
  const preset = useTOTPModalWrapper(setRSSHubMutation.mutateAsync)
  const details = useAuthQuery(Queries.rsshub.get({ id: instance.id }))
  const hasPurchase = !!details.data?.purchase
  const price = instance.ownerUserId === whoami()?.id ? 0 : instance.price

  const formSchema = z.object({
    months: z.coerce
      .number()
      .min(hasPurchase ? 0 : 1)
      .max(12),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      months: hasPurchase ? 0 : 1,
    },
  })

  const months = form.watch("months")

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    preset({ id: instance.id, durationInMonths: data.months })
  }

  useEffect(() => {
    if (setRSSHubMutation.isSuccess) {
      dismiss()
    }
  }, [setRSSHubMutation.isSuccess])

  return (
    <div className="max-w-[550px] space-y-4 lg:min-w-[550px]">
      <Card>
        <CardContent className="max-w-2xl space-y-2 p-6">
          <div className="mb-3 text-lg font-medium">{t("rsshub.useModal.about")}</div>
          <table className="w-full">
            <tbody className="divide-y-8 divide-transparent">
              <tr>
                <td className="text-text-secondary w-24 text-sm">{t("rsshub.table.owner")}</td>
                <td>
                  <UserAvatar
                    userId={instance.ownerUserId}
                    className="h-auto justify-start p-0"
                    avatarClassName="size-6"
                  />
                </td>
              </tr>
              <tr>
                <td className="text-text-secondary text-sm">{t("rsshub.table.description")}</td>
                <td className="line-clamp-2">{instance.description}</td>
              </tr>
              <tr>
                <td className="text-text-secondary text-sm">{t("rsshub.table.price")}</td>
                <td className="flex items-center gap-1">
                  {instance.price} <i className="i-mgc-power text-accent" />
                </td>
              </tr>
              <tr>
                <td className="text-text-secondary text-sm">{t("rsshub.table.userCount")}</td>
                <td>{instance.userCount}</td>
              </tr>
              <tr>
                <td className="text-text-secondary text-sm">{t("rsshub.table.userLimit")}</td>
                <td>{instance.userLimit || t("rsshub.table.unlimited")}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      {details.data?.purchase && (
        <div>
          <div className="text-text-secondary text-sm">
            {t("rsshub.useModal.purchase_expires_at")}
          </div>
          <div className="line-clamp-2">
            {new Date(details.data.purchase.expiresAt).toLocaleString()}
          </div>
        </div>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {price > 0 && (
            <FormField
              control={form.control}
              name="months"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-4">
                  <FormLabel>{t("rsshub.useModal.months_label")}</FormLabel>
                  <FormControl className="!mt-0">
                    <div className="flex items-center gap-10">
                      <div className="space-x-2">
                        <Input
                          className="w-24"
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          max={12}
                          min={hasPurchase ? 0 : 1}
                          {...field}
                        />
                        <span className="text-text-secondary text-sm">
                          {t("rsshub.useModal.month")}
                        </span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="flex items-center justify-end">
            <Button type="submit" isLoading={setRSSHubMutation.isPending}>
              {price ? (
                <Trans
                  ns="settings"
                  i18nKey={"rsshub.useModal.useWith"}
                  components={{ Power: <i className="i-mgc-power ml-1 text-white" /> }}
                  values={{ amount: price * months }}
                />
              ) : (
                t("rsshub.table.use")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
