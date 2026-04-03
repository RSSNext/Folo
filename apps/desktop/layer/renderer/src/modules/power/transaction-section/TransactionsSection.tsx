import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import { Tabs, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { useWhoami } from "@follow/store/user/hooks"
import { cn } from "@follow/utils/utils"
import { TransactionTypes } from "@follow-app/client-sdk"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { getBlockchainExplorerUrl } from "~/lib/utils"
import { SettingSectionTitle } from "~/modules/settings/section"
import { useWallet, useWalletTransactions } from "~/queries/wallet"

import { TxTable } from "./tx-table"

const tabs = ["all", ...TransactionTypes] as const

export const TransactionsSection: Component = ({ className }) => {
  const { t } = useTranslation("settings")
  const user = useWhoami()
  const wallet = useWallet()
  const myWallet = wallet.data?.[0]

  const [type, setType] = useState("all")

  const transactions = useWalletTransactions({
    fromOrToUserId: user?.id,
    type: type === "all" ? undefined : (type as (typeof TransactionTypes)[number]),
  })

  if (!myWallet) return null

  const hasTransactions = Boolean(transactions.data?.length)

  return (
    <div
      className={cn(
        "relative flex min-w-0 grow flex-col rounded-2xl border border-fill-secondary bg-material-ultra-thin p-5 shadow-sm",
        className,
      )}
    >
      <SettingSectionTitle title={t("wallet.transactions.title")} />
      <Tabs value={type} onValueChange={(val) => setType(val)}>
        <TabsList className="relative border-b-transparent">
          {tabs.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="py-0">
              {t(`wallet.transactions.types.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {hasTransactions ? <TxTable type={type} /> : null}
      {hasTransactions && (
        <a
          className="my-2 w-full text-sm text-zinc-400 underline"
          href={`${getBlockchainExplorerUrl()}/address/${myWallet.address}`}
          target="_blank"
        >
          {t("wallet.transactions.more")}
        </a>
      )}

      {(transactions.isFetching || !hasTransactions) && (
        <div className="my-4 flex w-full justify-center text-sm text-zinc-400">
          {transactions.isFetching ? (
            <LoadingCircle size="medium" />
          ) : (
            <div className="flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 px-6 text-center">
              <i className="i-mgc-power mb-3 text-4xl text-text-quaternary" />
              <p className="text-sm font-medium text-text">
                {t("wallet.transactions.empty.title")}
              </p>
              <p className="mt-1 max-w-sm text-sm text-text-secondary">
                {t("wallet.transactions.empty.description")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
