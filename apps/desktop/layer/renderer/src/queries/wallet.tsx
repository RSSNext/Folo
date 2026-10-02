import type { TransactionQuery } from "@follow-app/client-sdk"
import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { useAuthQuery } from "~/hooks/common"
import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"
import { getFetchErrorMessage } from "~/lib/error-parser"
import { createLegacyWallet } from "~/lib/wallet-compat"

export const wallet = {
  get: () =>
    defineQuery(
      ["wallet"],
      async () => {
        const res = await followClient.api.wallets.get()

        return res.data
      },
      {
        rootKey: ["wallet"],
      },
    ),

  transactions: {
    get: (query: TransactionQuery) =>
      defineQuery(
        ["wallet", "transactions", query],
        async () => {
          const res = await followClient.api.wallets.transactions.get(query)

          return res.data
        },
        {
          rootKey: ["wallet", "transactions"],
        },
      ),
  },
}

export const useWallet = (options?: { enabled?: boolean }) =>
  useAuthQuery(wallet.get(), {
    refetchOnMount: true,
    // `useAuthQuery` lets an explicit `enabled` replace its own login check, so only the
    // "off" case is passed on.
    ...(options?.enabled === false && { enabled: false }),
  })

export const useWalletTransactions = (query: Parameters<typeof wallet.transactions.get>[0] = {}) =>
  useAuthQuery(wallet.transactions.get(query))

export const useCreateWalletMutation = () => {
  const { t } = useTranslation("settings")

  return useMutation({
    mutationKey: ["createWallet"],
    mutationFn: () => createLegacyWallet(),
    async onError(err) {
      toast.error(await getFetchErrorMessage(err))
    },
    onSuccess() {
      wallet.get().invalidate()
      toast(t("wallet.create.success"))
    },
  })
}
