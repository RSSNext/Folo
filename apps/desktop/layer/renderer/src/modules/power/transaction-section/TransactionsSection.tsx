import { LoadingCircle } from "@follow/components/ui/loading/index.js"
import { Tabs, TabsList, TabsTrigger } from "@follow/components/ui/tabs/index.jsx"
import { TransactionTypes } from "@follow/models/types"
import { useWhoami } from "@follow/store/user/hooks"
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

  return (
    <div className="relative flex min-w-0 grow flex-col">
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
      <TxTable type={type} className={className} />
      {!!transactions.data?.length && (
        <a
          className="my-2 w-full text-sm text-zinc-400 underline"
          href={`${getBlockchainExplorerUrl()}/address/${myWallet.address}`}
          target="_blank"
        >
          {t("wallet.transactions.more")}
        </a>
      )}

      {(transactions.isFetching || !transactions.data?.length) && (
        <div className="my-2 flex w-full justify-center text-sm text-zinc-400">
          {transactions.isFetching ? (
            <LoadingCircle size="medium" />
          ) : (
            t("wallet.transactions.noTransactions")
          )}
        </div>
      )}
    </div>
  )
}
