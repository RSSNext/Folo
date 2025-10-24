import { tracker } from "@follow/tracker"
import type { TransactionQuery } from "@follow-app/client-sdk"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { useAuthQuery } from "~/hooks/common"
import { followClient } from "~/lib/api-client"
import { defineQuery } from "~/lib/defineQuery"
import { getFetchErrorMessage, toastFetchError } from "~/lib/error-parser"

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

  claimCheck: () =>
    defineQuery(["wallet", "claimCheck"], async () =>
      followClient.api.wallets.transactions.claimCheck(),
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

  ranking: {
    get: () =>
      defineQuery(
        ["wallet", "ranking"],
        async () => {
          const res = await followClient.api.wallets.ranking()
          return res.data
        },
        {
          rootKey: ["wallet", "ranking"],
        },
      ),
  },
}

export const useWallet = () =>
  useAuthQuery(wallet.get(), {
    refetchOnMount: true,
  })

export const useWalletTransactions = (query: Parameters<typeof wallet.transactions.get>[0] = {}) =>
  useAuthQuery(wallet.transactions.get(query))

export const useWalletRanking = () => useAuthQuery(wallet.ranking.get())

export const useCreateWalletMutation = () =>
  useMutation({
    mutationKey: ["createWallet"],
    mutationFn: () => followClient.api.wallets.post(),
    async onError(err) {
      toast.error(await getFetchErrorMessage(err))
    },
    onSuccess() {
      wallet.get().invalidate()
      toast("🎉 Wallet created.")
    },
  })

export const useClaimCheck = () =>
  useAuthQuery(wallet.claimCheck(), {
    refetchInterval: 1 * 60 * 60 * 1000,
  })

export const useClaimWalletDailyRewardMutation = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationKey: ["claimWalletDailyReward"],
    mutationFn: ({ tokenV2, tokenV3 }: { tokenV2?: string | null; tokenV3?: string | null }) =>
      followClient.api.wallets.transactions.claimDaily(undefined, {
        headers:
          tokenV2 || tokenV3
            ? {
                "x-token": tokenV2 ? `r2:${tokenV2}` : `r3:${tokenV3}`,
              }
            : undefined,
      }),
    async onError(err) {
      toastFetchError(err)
    },
    onSuccess() {
      wallet.get().invalidate()
      wallet.claimCheck().invalidate()
      tracker.dailyRewardClaimed()

      toast(
        <div className="flex items-center gap-1 text-lg" onClick={() => navigate("/power")}>
          <i className="i-mgc-power text-folo animate-flip" />
        </div>,
        {
          unstyled: true,
          position: "bottom-left",
          classNames: {
            toast: "w-full flex justify-start !shadow-none !bg-transparent",
          },
        },
      )
    },
  })
}
