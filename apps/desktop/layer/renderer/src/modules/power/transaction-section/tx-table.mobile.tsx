import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import type { TransactionTypes } from "@follow/models"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import { useWhoami } from "~/atoms/user"
import { getBlockchainExplorerUrl } from "~/lib/utils"
import { Balance } from "~/modules/wallet/balance"
import { useWalletTransactions } from "~/queries/wallet"

import type { TxTableProps } from "./tx-table.shared"
import { BalanceRenderer, UserRenderer } from "./tx-table.shared"

const UserTooltip = ({ user, currentUserId }: { user: any; currentUserId?: string }) => {
  const { t } = useTranslation("settings")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <UserRenderer hideName user={user} iconClassName="size-6" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {user?.id === currentUserId ? (
          <span className="font-bold">{t("wallet.transactions.you")}</span>
        ) : (
          <span>{user?.name}</span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export const TxTable = ({ type }: TxTableProps) => {
  const { t } = useTranslation("settings")
  const user = useWhoami()
  const transactions = useWalletTransactions({
    fromOrToUserId: user?.id,
    type: type === "all" ? undefined : (type as (typeof TransactionTypes)[number]),
  })
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {transactions.data?.map((row) => (
        <li key={row.hash} className="flex flex-col rounded border p-3">
          <div className="flex w-full items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <UserTooltip user={row.fromUser} currentUserId={user?.id} />
                <span>{t(`wallet.transactions.types.${row.type}`)}</span>
                <i className="i-mgc-right-cute-re shrink-0" />
                <UserTooltip user={row.toUser} currentUserId={user?.id} />
              </div>
            </div>

            <div className="relative flex flex-col items-end">
              <BalanceRenderer
                sign={row.fromUserId === user?.id ? "-" : "+"}
                amount={row.powerToken}
                tax={"0"}
              />

              {row.tax !== "0" && (
                <span className="absolute bottom-0 translate-y-full whitespace-nowrap text-xs opacity-80">
                  Tax: <Balance>{row.tax}</Balance>
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex flex-col items-start justify-start gap-1 text-xs opacity-80">
            <span>{dayjs(row.createdAt).format("LLL")}</span>
            <a
              target="_blank"
              href={`${getBlockchainExplorerUrl()}/tx/${row.hash}`}
              className="underline"
            >
              {row.hash.slice(0, 16)}...
            </a>
          </div>
        </li>
      ))}
    </ul>
  )
}
