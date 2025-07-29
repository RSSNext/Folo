import { tracker } from "@follow/tracker"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { useAuthQuery } from "~/hooks/common"
import { apiClient } from "~/lib/api-fetch"
import { defineQuery } from "~/lib/defineQuery"
import { getFetchErrorMessage, toastFetchError } from "~/lib/error-parser"

export const wallet = {
  get: ({ userId }: { userId?: string } = {}) =>
    defineQuery(
      ["wallet", userId].filter(Boolean),
      async () => {
        const res = await apiClient.wallets.$get({
          query: { userId },
        })

        return res.data
      },
      {
        rootKey: ["wallet"],
      },
    ),

  claimCheck: () =>
    defineQuery(["wallet", "claimCheck"], async () =>
      apiClient.wallets.transactions["claim-check"].$get(),
    ),

  transactions: {
    get: (query: Parameters<typeof apiClient.wallets.transactions.$get>[0]["query"] = {}) =>
      defineQuery(
        ["wallet", "transactions", query].filter(Boolean),
        async () => {
          const res = await apiClient.wallets.transactions.$get({ query })

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
          const res = await apiClient.wallets.ranking.$get()
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
    mutationFn: () => apiClient.wallets.$post(),
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
      apiClient.wallets.transactions.claim_daily.$post(
        { json: {} },
        {
          headers:
            tokenV2 || tokenV3
              ? {
                  "x-token": tokenV2 ? `r2:${tokenV2}` : `r3:${tokenV3}`,
                }
              : undefined,
        },
      ),
    async onError(err) {
      toastFetchError(err)
    },
    onSuccess() {
      wallet.get().invalidate()
      wallet.claimCheck().invalidate()
      tracker.dailyRewardClaimed()

      toast(
        <div className="flex items-center gap-1 text-lg" onClick={() => navigate("/power")}>
          <i className="i-mgc-power text-accent animate-flip" />
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

export const useWalletTipMutation = () =>
  useMutation({
    mutationKey: ["walletTip"],
    mutationFn: (data: Parameters<typeof apiClient.wallets.transactions.tip.$post>[0]["json"]) =>
      apiClient.wallets.transactions.tip.$post({ json: data }),
    async onError(err) {
      toastFetchError(err)
    },
    onSuccess(response, variables) {
      wallet.get().invalidate()
      wallet.transactions.get().invalidate()
      tracker.tipSent({
        amount: variables.amount,
        entryId: variables.entryId,
        transactionId: response.data.transactionHash,
      })
      toast("🎉 Tipped.")
    },
  })
