import { Button } from "@follow/components/ui/button/index.js"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@follow/components/ui/form/index.jsx"
import { Input } from "@follow/components/ui/input/index.js"
import { Switch } from "@follow/components/ui/switch/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.jsx"
import { cn } from "@follow/utils/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { from, toNumber } from "dnum"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"
import { z } from "zod"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAuthQuery } from "~/hooks/common/useBizQuery"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { useTOTPModalWrapper } from "~/modules/profile/hooks"
import { Balance } from "~/modules/wallet/balance"
import { useWallet, wallet as walletActions } from "~/queries/wallet"

export const WithdrawButton = () => {
  const { t } = useTranslation("settings")
  const { present } = useModalStack()

  const onClick = () => {
    present({
      title: t("wallet.withdraw.modalTitle"),
      content: ({ dismiss }) => <WithdrawModalContent dismiss={dismiss} />,
    })
  }

  return (
    <Button variant="outline" onClick={onClick}>
      {t("wallet.withdraw.button")}
    </Button>
  )
}

const WithdrawModalContent = ({ dismiss }: { dismiss: () => void }) => {
  const { t } = useTranslation("settings")
  const wallet = useWallet()
  const cashablePowerTokenBigInt = [BigInt(wallet.data?.[0]!.cashablePowerToken || 0n), 18] as const
  const cashablePowerTokenNumber = toNumber(cashablePowerTokenBigInt)

  const formSchema = z.object({
    address: z.string().startsWith("0x").length(42),
    amount: z.number().positive().max(cashablePowerTokenNumber),
    toRss3: z.boolean().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  const powerPrice = useAuthQuery(
    defineQuery(["power-price"], async () => {
      const res = await apiClient.wallets["power-price"].$get()
      return res.data
    }),
  )

  const mutation = useMutation({
    mutationFn: async ({
      address,
      amount,
      toRss3,
      TOTPCode,
    }: {
      address: string
      amount: number
      toRss3?: boolean
      TOTPCode?: string
    }) => {
      const amountBigInt = from(amount, 18)[0]
      await apiClient.wallets.transactions.withdraw.$post({
        json: {
          address,
          amount: amountBigInt.toString(),
          toRss3,
          TOTPCode,
        },
      })
    },
  })
  const present = useTOTPModalWrapper(mutation.mutateAsync, { force: true })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    present(values)
  }

  useEffect(() => {
    if (mutation.isError) {
      toast.error(t("wallet.withdraw.error", { error: mutation.error?.message }))
    }
  }, [mutation.isError, t])

  useEffect(() => {
    if (mutation.isSuccess) {
      toast.success(t("wallet.withdraw.success"))
      walletActions.get().invalidate()
      walletActions.transactions.get().invalidate()
      dismiss()
    }
  }, [mutation.isSuccess, t, dismiss])

  return (
    <>
      <div className={cn(!cashablePowerTokenNumber && "text-orange-700", "mb-4 text-sm")}>
        <Trans
          i18nKey="wallet.withdraw.availableBalance"
          components={{
            Balance: (
              <Balance className="inline-block" value={wallet.data?.[0]!.cashablePowerToken || "0"}>
                {wallet.data?.[0]!.cashablePowerToken || "0"}
              </Balance>
            ),
          }}
          ns="settings"
        />
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:w-96">
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("wallet.withdraw.addressLabel")}</FormLabel>
                <FormControl>
                  <Input autoFocus {...field} placeholder="0x..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("wallet.withdraw.amountLabel")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(value) => field.onChange(value.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="toRss3"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel className="flex items-center gap-1">
                    {t("wallet.withdraw.toRss3Label")}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <i className="i-mgc-question-cute-re text-sm" />
                      </TooltipTrigger>
                      <TooltipPortal>
                        <TooltipContent>
                          <span className="text-xs text-gray-500">
                            1 POWER = {powerPrice.data?.rss3 ?? "-"} RSS3
                          </span>
                        </TooltipContent>
                      </TooltipPortal>
                    </Tooltip>
                  </FormLabel>
                  <FormControl className="!mt-0">
                    <span className="inline-flex">
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </span>
                  </FormControl>
                </div>
                {field.value && (
                  <span className="text-xs text-gray-500">
                    {t("wallet.withdraw.receiveRSS3", {
                      amount: ((form.watch("amount") || 0) * (powerPrice.data?.rss3 ?? 0)).toFixed(
                        4,
                      ),
                    })}
                  </span>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="center flex">
            <Button disabled={!form.formState.isValid} type="submit" isLoading={mutation.isPending}>
              {t("wallet.withdraw.submitButton")}
            </Button>
          </div>
        </form>
      </Form>
    </>
  )
}
